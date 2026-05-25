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
        this.logger.log(`AzureOpenAI configured endpoint=${endpoint} deployment=${this.deployment ? this.deployment : '<none>'}`);
        if (endpoint.includes('/openai')) {
            this.logger.warn('AzureOpenAI endpoint contains "/openai" path — consider using the resource root URL without /openai/v1');
        }
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
            if (error && typeof error === 'object') {
                // log stack and known HTTP response fields if present
                try {
                    // @ts-ignore
                    if (error.stack) this.logger.debug(`Stack: ${error.stack}`);
                    // @ts-ignore
                    if (error.statusCode) this.logger.debug(`statusCode: ${error.statusCode}`);
                    // @ts-ignore
                    if (error.response) this.logger.debug(`response: ${JSON.stringify(error.response)}`);
                    // @ts-ignore
                    if (error.body) this.logger.debug(`body: ${JSON.stringify(error.body)}`);
                } catch (e) {
                    this.logger.debug('Failed to stringify error details');
                }
            }

            // In development, fall back to a deterministic mock so local testing
            // can continue even if Azure credentials or network fail.
            if (process.env.NODE_ENV === 'development') {
                this.logger.warn('Falling back to mock script in development mode');
                const mock = `Scene 1: [Establishing shot] ${story.substring(0, 120)}... (mock script)`;
                return mock;
            }

            throw new Error(`AzureOpenAI script generation failed: ${message}`);
        }
    }

    async generateImage(userId: string, prompt: string): Promise<string> {
        if (!prompt || prompt.trim().length === 0) {
            throw new Error('Image prompt cannot be empty');
        }

        const start = Date.now();
        this.logger.log(`AzureOpenAI generateImage (DALL·E) request for user=${userId}`);
        this.logger.debug(`AzureOpenAI image prompt preview: ${prompt.substring(0, 200)}`);

        try {
            const response = await this.client.getImages(this.deployment, prompt, {
                size: '1024x1024',
                n: 1,
                responseFormat: 'url',
            });

            const latency = Date.now() - start;
            this.logger.log(`AzureOpenAI generateImage completed for user=${userId} latency=${latency}ms`);

            const imageUrl = response.data?.[0]?.url;
            if (!imageUrl) {
                throw new Error('Azure OpenAI returned no image URL');
            }

            this.logger.debug(`AzureOpenAI image generated successfully`);
            return imageUrl;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown Azure OpenAI image error';
            this.logger.error(`AzureOpenAI generateImage failed: ${message}`);
            if (error && typeof error === 'object') {
                try {
                    // @ts-ignore
                    if (error.statusCode) this.logger.debug(`statusCode: ${error.statusCode}`);
                    // @ts-ignore
                    if (error.code) this.logger.debug(`code: ${error.code}`);
                    // @ts-ignore
                    if (error.response) this.logger.debug(`response: ${JSON.stringify(error.response)}`);
                } catch (e) {
                    this.logger.debug('Failed to log error details');
                }
            }

            throw error;
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
