import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { GenerateScriptDto, GenerateScriptResponseDto } from './dto/generate-script.dto';
import { Anthropic } from '@anthropic-ai/sdk';
import { PrismaService } from '../common/prisma/prisma.service';
import { QueueService } from '../common/queue/queue.service';

@Injectable()
export class GenerateService {
  private client: Anthropic;

  constructor(
    private prisma: PrismaService,
    private queue: QueueService,
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
}
