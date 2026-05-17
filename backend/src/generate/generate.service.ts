import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { GenerateScriptDto, GenerateScriptResponseDto } from './dto/generate-script.dto';
import { Anthropic } from '@anthropic-ai/sdk';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class GenerateService {
  private client: Anthropic;

  constructor(private prisma: PrismaService) {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Generate script from story text
   * Creates a Prisma Job record to track the generation
   */
  async generateScript(
    userId: string,
    dto: GenerateScriptDto,
  ): Promise<GenerateScriptResponseDto> {
    if (!dto.story || dto.story.trim().length === 0) {
      throw new BadRequestException('Story cannot be empty');
    }

    // Create Job record with 'processing' status
    let job;
    try {
      job = await this.prisma.job.create({
        data: {
          userId,
          projectId: null, // Will be populated later when project is created
          type: 'script',
          status: 'processing',
          progress: 10,
        },
      });
    } catch (error) {
      console.error('Failed to create job record:', error);
      throw new BadRequestException('Failed to create generation job');
    }

    try {
      const prompt = this._buildScriptPrompt(dto.story, dto.style, dto.duration);

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

      // Update Job record with completed status and result
      const updatedJob = await this.prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          progress: 100,
          result: JSON.stringify({ script }),
          completedAt: new Date(),
          processingTimeMs: Date.now() - job.createdAt.getTime(),
        },
      });

      return {
        script,
        jobId: updatedJob.id,
        status: 'completed',
        createdAt: updatedJob.createdAt,
      };
    } catch (error) {
      // Update Job record with failed status
      await this.prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
          processingTimeMs: Date.now() - job.createdAt.getTime(),
        },
      });

      console.error('Claude API error:', error);
      throw new BadRequestException('Failed to generate script');
    }
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
