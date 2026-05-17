import { Injectable, BadRequestException } from '@nestjs/common';
import { GenerateScriptDto, GenerateScriptResponseDto } from './dto/generate-script.dto';
import { Anthropic } from '@anthropic-ai/sdk';

@Injectable()
export class GenerateService {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async generateScript(dto: GenerateScriptDto): Promise<GenerateScriptResponseDto> {
    if (!dto.story || dto.story.trim().length === 0) {
      throw new BadRequestException('Story cannot be empty');
    }

    const prompt = this._buildScriptPrompt(dto.story, dto.style, dto.duration);

    try {
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
      const jobId = this._generateJobId();

      return {
        script,
        jobId,
        status: 'completed',
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('Claude API error:', error);
      throw new BadRequestException('Failed to generate script');
    }
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

  private _generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
