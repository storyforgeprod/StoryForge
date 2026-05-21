import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GenerateScriptDto, GenerateScriptResponseDto } from './dto/generate-script.dto';
import { GenerateImagesDto, GenerateImagesResponseDto, ImageGenerationResult } from './dto/generate-images.dto';
import { GenerateAudioDto, GenerateAudioResponseDto, AudioGenerationResult } from './dto/generate-audio.dto';
import { GenerateVideoDto, GenerateVideoResponseDto, VideoAssemblyResult } from './dto/generate-video.dto';
import { Anthropic } from '@anthropic-ai/sdk';
import { PrismaService } from '../common/prisma/prisma.service';
import { QueueService } from '../common/queue/queue.service';
import { ReplicateService } from '../integrations/replicate.service';
import { ElevenLabsService } from '../integrations/elevenlabs.service';
import { VideoService } from '../integrations/video.service';

@Injectable()
export class GenerateService {
  private client: Anthropic;

  constructor(
    private prisma: PrismaService,
    private queue: QueueService,
    private replicateService: ReplicateService,
    private elevenLabsService: ElevenLabsService,
    private videoService: VideoService,
  ) {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Generate script from story text
   * Creates Job (pending) + adds to queue, returns immediately
   * Queue processor handles Claude API call asynchronously
   */
  async generateScript(
    userId: string,
    dto: GenerateScriptDto,
  ): Promise<GenerateScriptResponseDto> {
    if (!dto.story || dto.story.trim().length === 0) {
      throw new BadRequestException('Story cannot be empty');
    }

    // 1. Create Job record with 'pending' status
    let job;
    try {
      job = await this.prisma.job.create({
        data: {
          userId,
          projectId: null,
          type: 'script',
          status: 'pending',
          progress: 0,
        },
      });
    } catch (error) {
      console.error('Failed to create job record:', error);
      throw new BadRequestException('Failed to create generation job');
    }

    // 2. Add to queue (async processing)
    try {
      await this.queue.addGenerationJob({
        jobId: job.id,
        userId,
        projectId: null,
        type: 'script',
        story: dto.story,
        _startTime: Date.now(),
      });
    } catch (error) {
      console.error('Failed to queue job:', error);
      // Update job to failed if queueing fails
      await this.prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          error: 'Failed to queue generation job',
        },
      });
      throw new BadRequestException('Failed to queue generation job');
    }

    // 3. Return immediately (client doesn't wait for Claude)
    return {
      jobId: job.id,
      status: 'pending',
      message: 'Script generation queued',
      createdAt: job.createdAt,
    };
  }

  /**
   * Generate script content (used by queue processor)
   * This is the actual async logic that calls Claude API
   */
  async generateScriptContent(
    userId: string,
    data: { story: string },
  ): Promise<{ script: string }> {
    const prompt = this._buildScriptPrompt(data.story, 'anime', 60);

    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const script = this._extractTextFromResponse(response);

    return { script };
  }

  /**
   * Get job status by ID
   */
  async getJobStatus(jobId: string, userId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.userId !== userId) {
      throw new BadRequestException('Unauthorized access to this job');
    }

    return {
      id: job.id,
      status: job.status,
      progress: job.progress,
      result: job.result ? JSON.parse(job.result) : null,
      error: job.error,
      completedAt: job.completedAt,
      processingTimeMs: job.processingTimeMs,
    };
  }

  private _buildScriptPrompt(story: string, style: string, duration: number = 60): string {
    return `You are a professional screenwriter specializing in short-form video content for YouTube Shorts.

Convert the following story into a script suitable for a video lasting approximately ${duration} seconds. The visual style should be ${style}.

IMPORTANT REQUIREMENTS:
1. Keep scenes SHORT and PUNCHY (2-3 seconds each)
2. Include vivid visual descriptions
3. Add sound effects in [BRACKETS]
4. Include suggested music tone
5. Format: Scene number, description, and duration

Story to adapt:
"""
${story}
"""

Provide only the script, no additional commentary.`;
  }

  private _extractTextFromResponse(response: any): string {
    if (response.content && response.content.length > 0) {
      return response.content[0].text || '';
    }
    return '';
  }

  /**
   * Generate images from script
   * Creates Job (pending) + adds to queue, returns immediately
   * Queue processor handles Replicate API call asynchronously
   */
  async generateImages(
    userId: string,
    dto: GenerateImagesDto,
  ): Promise<GenerateImagesResponseDto> {
    // 1. Validate input
    if (!dto.scriptId || dto.scriptId.trim().length === 0) {
      throw new BadRequestException('scriptId is required');
    }

    // 2. Verify script job exists and belongs to user
    const scriptJob = await this.prisma.job.findUnique({
      where: { id: dto.scriptId },
    });

    if (!scriptJob) {
      throw new NotFoundException('Script job not found');
    }

    if (scriptJob.userId !== userId) {
      throw new ForbiddenException('Unauthorized access to this script');
    }

    // 3. Create Image Job
    let imageJob;
    try {
      imageJob = await this.prisma.job.create({
        data: {
          userId,
          projectId: scriptJob.projectId,
          type: 'images',
          status: 'pending',
          progress: 0,
        },
      });
    } catch (error) {
      console.error('Failed to create image job:', error);
      throw new BadRequestException('Failed to create image generation job');
    }

    // 4. Queue image generation job
    try {
      await this.queue.addGenerationJob({
        jobId: imageJob.id,
        userId,
        projectId: scriptJob.projectId,
        type: 'images',
        scriptId: dto.scriptId,
        style: dto.style,
        imageDescription: dto.imageDescription,
        _startTime: Date.now(),
      });
    } catch (error) {
      console.error('Failed to queue image job:', error);
      await this.prisma.job.update({
        where: { id: imageJob.id },
        data: {
          status: 'failed',
          error: 'Failed to queue image generation job',
        },
      });
      throw new BadRequestException('Failed to queue image generation job');
    }

    // 5. Return immediately
    return {
      jobId: imageJob.id,
      status: 'pending',
      message: 'Image generation queued',
      createdAt: imageJob.createdAt,
    };
  }

  /**
   * Generate image content (used by queue processor)
   * This is the actual async logic that calls Replicate API
   */
  async generateImageContent(
    userId: string,
    data: { jobId: string; scriptId: string; style?: string },
  ): Promise<ImageGenerationResult> {
    // 1. Fetch original script Job to get the generated script
    const scriptJob = await this.prisma.job.findUnique({
      where: { id: data.scriptId },
    });

    if (!scriptJob || !scriptJob.result) {
      throw new BadRequestException('Script job not found or incomplete');
    }

    // 2. Parse script result to extract visual description
    let scriptContent: string;
    try {
      const parsed = JSON.parse(scriptJob.result);
      scriptContent = parsed.script || scriptJob.result;
    } catch {
      scriptContent = scriptJob.result;
    }

    // 3. Generate image prompt from script using Claude
    const imagePrompt = await this._buildImagePrompt(scriptContent, data.style);

    // 4. Call Replicate to generate image
    const imageUrls = await this.replicateService.generateImage(imagePrompt, {
      numImages: 1,
    });

    return {
      imageUrls,
      prompt: imagePrompt,
      generatedAt: new Date(),
    };
  }

  private async _buildImagePrompt(scriptContent: string, style?: string): Promise<string> {
    // Use Claude to create a detailed image prompt from script
    const message = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Based on this story script, create a concise visual description for generating a cover image (max 100 words, use vivid descriptive language):

${scriptContent}

Respond with ONLY the visual description, no explanations.`,
        },
      ],
    });

    const description = this._extractTextFromResponse(message);
    return style ? `${style} style, ${description}` : description;
  }

  /**
   * Generate audio narration from script
   * Creates Job (pending) + adds to queue, returns immediately
   * Queue processor handles ElevenLabs API call asynchronously
   */
  async generateAudio(
    userId: string,
    dto: GenerateAudioDto,
  ): Promise<GenerateAudioResponseDto> {
    // 1. Validate input
    if (!dto.scriptId || dto.scriptId.trim().length === 0) {
      throw new BadRequestException('scriptId is required');
    }

    // 2. Verify script job exists and belongs to user
    const scriptJob = await this.prisma.job.findUnique({
      where: { id: dto.scriptId },
    });

    if (!scriptJob) {
      throw new NotFoundException('Script job not found');
    }

    if (scriptJob.userId !== userId) {
      throw new ForbiddenException('Unauthorized access to this script');
    }

    if (scriptJob.status !== 'completed') {
      throw new BadRequestException(
        `Script job must be completed first (current: ${scriptJob.status})`,
      );
    }

    // 3. Create Audio Job
    let audioJob;
    try {
      audioJob = await this.prisma.job.create({
        data: {
          userId,
          projectId: scriptJob.projectId,
          type: 'audio',
          status: 'pending',
          progress: 0,
        },
      });
    } catch (error) {
      console.error('Failed to create audio job:', error);
      throw new BadRequestException('Failed to create audio generation job');
    }

    // 4. Queue audio generation job
    try {
      await this.queue.addGenerationJob({
        jobId: audioJob.id,
        userId,
        projectId: scriptJob.projectId,
        type: 'audio',
        scriptId: dto.scriptId,
        voiceId: dto.voiceId,
        _startTime: Date.now(),
      });
    } catch (error) {
      console.error('Failed to queue audio job:', error);
      await this.prisma.job.update({
        where: { id: audioJob.id },
        data: {
          status: 'failed',
          error: 'Failed to queue audio generation job',
        },
      });
      throw new BadRequestException('Failed to queue audio generation job');
    }

    // 5. Return immediately
    return {
      jobId: audioJob.id,
      status: 'pending',
      message: 'Audio generation queued',
      createdAt: audioJob.createdAt,
    };
  }

  /**
   * Generate audio content (used by queue processor)
   * This is the actual async logic that calls ElevenLabs API
   */
  async generateAudioContent(
    userId: string,
    data: { jobId: string; scriptId: string; voiceId?: string },
  ): Promise<AudioGenerationResult> {
    // 1. Fetch the script job result
    const scriptJob = await this.prisma.job.findUnique({
      where: { id: data.scriptId },
    });

    if (!scriptJob || !scriptJob.result) {
      throw new BadRequestException('Script job not found or incomplete');
    }

    // 2. Parse script text
    let scriptText: string;
    try {
      const parsed = JSON.parse(scriptJob.result);
      scriptText = parsed.script || scriptJob.result;
    } catch {
      scriptText = scriptJob.result;
    }

    // 3. Generate audio via ElevenLabs
    const audioUrl = await this.elevenLabsService.generateAudio(scriptText, {
      voiceId: data.voiceId,
    });

    // 4. Calculate audio length (rough estimate: 150 words per minute)
    const wordCount = scriptText.split(' ').length;
    const audioLength = Math.ceil((wordCount / 150) * 60);

    return {
      audioUrl,
      audioLength,
      textUsed: scriptText.substring(0, 100),
      generatedAt: new Date(),
    };
  }

  /**
   * Generate video from images and audio
   * Creates Job (pending) + adds to queue, returns immediately
   * Queue processor handles FFmpeg call asynchronously
   */
  async generateVideo(
    userId: string,
    dto: GenerateVideoDto,
  ): Promise<GenerateVideoResponseDto> {
    // 1. Validate inputs
    if (!dto.imageJobId || dto.imageJobId.trim().length === 0) {
      throw new BadRequestException('imageJobId is required');
    }

    if (!dto.audioJobId || dto.audioJobId.trim().length === 0) {
      throw new BadRequestException('audioJobId is required');
    }

    // 2. Verify image job exists and belongs to user
    const imageJob = await this.prisma.job.findUnique({
      where: { id: dto.imageJobId },
    });

    if (!imageJob || imageJob.userId !== userId) {
      throw new ForbiddenException('Unauthorized access to this image job');
    }

    if (imageJob.status !== 'completed') {
      throw new BadRequestException(
        `Image job must be completed first (current: ${imageJob.status})`,
      );
    }

    // 3. Verify audio job exists and belongs to user
    const audioJob = await this.prisma.job.findUnique({
      where: { id: dto.audioJobId },
    });

    if (!audioJob || audioJob.userId !== userId) {
      throw new ForbiddenException('Unauthorized access to this audio job');
    }

    if (audioJob.status !== 'completed') {
      throw new BadRequestException(
        `Audio job must be completed first (current: ${audioJob.status})`,
      );
    }

    // 4. Create Video Job
    let videoJob;
    try {
      videoJob = await this.prisma.job.create({
        data: {
          userId,
          projectId: imageJob.projectId,
          type: 'video',
          status: 'pending',
          progress: 0,
        },
      });
    } catch (error) {
      console.error('Failed to create video job:', error);
      throw new BadRequestException('Failed to create video assembly job');
    }

    // 5. Queue the job
    try {
      await this.queue.addGenerationJob({
        jobId: videoJob.id,
        userId,
        projectId: imageJob.projectId,
        type: 'video',
        imageJobId: dto.imageJobId,
        audioJobId: dto.audioJobId,
        fps: dto.fps,
        bitrate: dto.bitrate,
        _startTime: Date.now(),
      });
    } catch (error) {
      console.error('Failed to queue video job:', error);
      await this.prisma.job.update({
        where: { id: videoJob.id },
        data: {
          status: 'failed',
          error: 'Failed to queue video assembly job',
        },
      });
      throw new BadRequestException('Failed to queue video assembly job');
    }

    // 6. Return immediately
    return {
      jobId: videoJob.id,
      status: 'pending',
      message: 'Video assembly queued',
      createdAt: videoJob.createdAt,
    };
  }

  /**
   * Generate video content (used by queue processor)
   * This is the actual async logic that calls VideoService (FFmpeg)
   */
  async generateVideoContent(
    userId: string,
    data: { jobId: string; imageJobId: string; audioJobId: string; fps?: number; bitrate?: string },
  ): Promise<VideoAssemblyResult> {
    // 1. Fetch the image job result
    const imageJob = await this.prisma.job.findUnique({
      where: { id: data.imageJobId },
    });

    if (!imageJob || imageJob.status !== 'completed') {
      throw new BadRequestException('Image job not completed');
    }

    const imageResult = JSON.parse(imageJob.result || '{}');
    const imageUrls = imageResult.imageUrls || [];

    // 2. Fetch the audio job result
    const audioJob = await this.prisma.job.findUnique({
      where: { id: data.audioJobId },
    });

    if (!audioJob || audioJob.status !== 'completed') {
      throw new BadRequestException('Audio job not completed');
    }

    const audioResult = JSON.parse(audioJob.result || '{}');
    const audioUrl = audioResult.audioUrl || '';

    // 3. Validate we have both resources
    if (!imageUrls || imageUrls.length === 0) {
      throw new BadRequestException('No image URLs found in image job result');
    }

    if (!audioUrl) {
      throw new BadRequestException('No audio URL found in audio job result');
    }

    // 4. Call VideoService to assemble video
    const videoUrl = await this.videoService.assembleVideo(imageUrls, audioUrl, {
      fps: data.fps,
      bitrate: data.bitrate,
      jobId: data.jobId,
    });

    const duration = audioResult.audioLength || 60;
    const fileSize = 0; // video is in cloud storage; local size not available

    return {
      videoUrl,
      duration,
      fileSize,
      format: 'mp4',
      generatedAt: new Date(),
    };
  }
}
