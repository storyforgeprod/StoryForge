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

    async generateScript(
        userId: string,
        story: string,
        targetScenes: number = 12,
        targetDuration: number = 60,
        tone?: string,
        language?: string,
    ): Promise<string> {
        if (!story || story.trim().length === 0) {
            throw new Error('Story cannot be empty');
        }

        const prompt = this.buildScriptPrompt(story, targetScenes, targetDuration, tone, language);
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

    private buildScriptPrompt(story: string, targetScenes: number = 12, targetDuration: number = 60, tone?: string, language?: string): string {
        const secondsPerScene = Math.round(targetDuration / targetScenes);
        const toneInstruction = tone
            ? `\nNARRATION TONE: Write with a ${tone} tone throughout all scenes.`
            : '';
        const LANGUAGE_NAMES: Record<string, string> = { en: 'English', es: 'Spanish', pt: 'Portuguese', fr: 'French' };
        const languageInstruction = language && language !== 'en'
            ? `\nOUTPUT LANGUAGE: Write the entire script in ${LANGUAGE_NAMES[language] ?? language}. All scene descriptions, sound effects, and music notes must be in ${LANGUAGE_NAMES[language] ?? language}.`
            : '';
        return `You are a professional screenwriter specializing in short-form video content for YouTube Shorts.${toneInstruction}${languageInstruction}

Convert the following story into a script suitable for a video lasting approximately ${targetDuration} seconds with exactly ${targetScenes} scenes.

IMPORTANT REQUIREMENTS:
1. Generate EXACTLY ${targetScenes} scenes (this is a MUST)
2. Each scene should be approximately ${secondsPerScene} seconds
3. Total duration across all scenes should be ~${targetDuration} seconds
4. Keep scenes SHORT and PUNCHY with vivid visual descriptions
5. Add sound effects in [BRACKETS]
6. Include suggested music tone

MANDATORY FORMAT (do NOT deviate):
Scene 1: [Visual description] (Xs)
[Sound: Sound effect description]
Music: [Music tone]

Scene 2: [Visual description] (Ys)
[Sound: Sound effect description]
Music: [Music tone]

...and so on.

CRITICAL: Each scene MUST include duration in parentheses like (2s), (3s), etc.
The sum of all scene durations should equal approximately ${targetDuration} seconds.
You MUST generate exactly ${targetScenes} scenes.

Story to adapt:
"""
${story}
"""

Provide only the script in the exact format above, no additional commentary.`;
    }

    /**
     * Generate audio narration from original story
     * Creates a concise narration that summarizes the story (not a literal reading of script)
     * Timed to fit the video duration
     */
    async generateAudioNarration(
        userId: string,
        story: string,
        targetDuration: number = 60,
        sceneCount: number = 1,
    ): Promise<string> {
        if (!story || story.trim().length === 0) {
            throw new Error('Story cannot be empty');
        }

        const prompt = this.buildAudioNarrationPrompt(story, targetDuration, sceneCount);
        const start = Date.now();

        try {
            const response = await this.client.getChatCompletions(this.deployment, [
                {
                    role: 'user',
                    content: prompt,
                },
            ]);

            const narration = response.choices?.[0]?.message?.content || '';
            if (!narration) {
                throw new Error('No narration generated');
            }

            const latency = Date.now() - start;
            this.logger.log(
                `AzureOpenAI generateAudioNarration completed for user=${userId} deployment=${this.deployment} latency=${latency}ms`,
            );

            return narration;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(`AzureOpenAI generateAudioNarration failed: ${message}`);
            throw error;
        }
    }

    private buildAudioNarrationPrompt(story: string, targetDuration: number = 60, sceneCount: number = 1): string {
        const wordsPerSecond = 2.5; // Average speaking rate
        const targetWords = Math.round(targetDuration * wordsPerSecond);
        
        return `You are a professional voice-over artist specializing in YouTube Shorts narration.

Create a compelling ${targetDuration}-second narration for a short-form video.

STORY (original narrative to base your narration on):
"""
${story}
"""

VIDEO STRUCTURE:
- Total duration: ${targetDuration} seconds
- Number of scenes: ${sceneCount}
- Average time per scene: ${Math.round(targetDuration / sceneCount)} seconds

YOUR TASK:
1. Summarize the KEY PLOT POINTS from the original story
2. Create a cohesive narrative that flows naturally
3. Target approximately ${targetWords} words (fits ${targetDuration}s at normal speaking pace)
4. Maintain emotional arc and tension from the original
5. Use vivid, descriptive language suitable for YouTube Shorts
6. DO NOT read the scene descriptions or technical directions
7. Write for a professional voice-over (clear, engaging, natural)

Provide ONLY the narration text. No stage directions, no timestamps, no scene numbers.
The narration should be engaging and storytelling-focused, not technical.`;
    }
}
