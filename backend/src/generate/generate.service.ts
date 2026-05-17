import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GenerateScriptDto, GenerateScriptResponseDto } from './dto/generate-script.dto';
import { GenerateImagesDto, GenerateImagesResponseDto, ImageGenerationResult } from './dto/generate-images.dto';
import { Anthropic } from '@anthropic-ai/sdk';
import { PrismaService } from '../common/prisma/prisma.service';
import { QueueService } from '../common/queue/queue.service';
import { ReplicateService } from '../integrations/replicate.service';

@Injectable()
export class GenerateService {
  private client: Anthropic;

  constructor(
    private prisma: PrismaService,
    private queue: QueueService,
    private replicateService: ReplicateService,
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
    data: { jobId: string; scriptId: string },
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
    const imagePrompt = await this._buildImagePrompt(scriptContent);

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

  private async _buildImagePrompt(scriptContent: string): Promise<string> {
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

    return this._extractTextFromResponse(message);
  }
}
