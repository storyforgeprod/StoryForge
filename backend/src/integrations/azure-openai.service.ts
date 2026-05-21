import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIClient } from '@azure/openai';
import { AzureKeyCredential } from '@azure/core-auth';

@Injectable()
export class AzureOpenAIService {
    private readonly logger = new Logger(AzureOpenAIService.name);
    private readonly client: OpenAIClient;
    private readonly deployment: string;

    constructor(private readonly configService: ConfigService) {
        const endpoint = this.configService.get<string>('AZURE_OPENAI_ENDPOINT', '');
        const apiKey = this.configService.get<string>('AZURE_OPENAI_API_KEY', '');
        const apiVersion = this.configService.get<string>('AZURE_OPENAI_API_VERSION', '2024-02-15-preview');
        this.deployment = this.configService.get<string>('AZURE_OPENAI_DEPLOYMENT_GPT41', '');

        if (!endpoint || !apiKey || !this.deployment) {
            this.logger.warn(
                'Missing Azure OpenAI configuration. Set AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, and AZURE_OPENAI_DEPLOYMENT_GPT41.',
            );
        }

        this.client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));
    }

    async generateScript(userId: string, story: string): Promise<string> {
        if (!story || story.trim().length === 0) {
            throw new Error('Story cannot be empty');
        }

        const prompt = this.buildScriptPrompt(story);
        const start = Date.now();

        try {
            const response = await this.client.getChatCompletions(this.deployment, [
                {
                    role: 'user',
                    content: prompt,
                },
            ], {
                maxTokens: 2048,
                temperature: 0.8,
            });

            const latency = Date.now() - start;
            const text = response.choices?.[0]?.message?.content || '';

            this.logger.log(
                `AzureOpenAI generateScript completed for user=${userId} deployment=${this.deployment} latency=${latency}ms`,
            );
            this.logger.debug(`AzureOpenAI response length: ${text.length}`);

            if (!text || text.trim().length === 0) {
                throw new Error('Azure OpenAI returned empty script');
            }

            return text.trim();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown Azure OpenAI error';
            this.logger.error(`AzureOpenAI generateScript failed: ${message}`);
            throw new Error(`AzureOpenAI script generation failed: ${message}`);
        }
    }

    private buildScriptPrompt(story: string): string {
        return `You are a professional screenwriter specializing in short-form video content for YouTube Shorts.

Convert the following story into a script suitable for a video lasting approximately 60 seconds.

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
}
