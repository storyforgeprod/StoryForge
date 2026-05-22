import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIClient } from '@azure/openai';
import { AzureKeyCredential } from '@azure/core-auth';

@Injectable()
export class AzureFoundryImageService {
    private readonly logger = new Logger(AzureFoundryImageService.name);
    private readonly client: OpenAIClient;
    private readonly deployment: string;

    constructor(private readonly configService: ConfigService) {
        const endpoint = this.configService.get<string>('AZURE_FOUNDRY_IMAGE_ENDPOINT', '');
        const apiKey = this.configService.get<string>('AZURE_FOUNDRY_IMAGE_API_KEY', '');
        const apiVersion = this.configService.get<string>('AZURE_OPENAI_API_VERSION', '2024-02-15-preview');
        this.deployment = this.configService.get<string>('AZURE_FOUNDRY_FLUX_DEPLOYMENT', '');

        if (!endpoint || !apiKey || !this.deployment) {
            this.logger.warn(
                'Missing Azure Foundry image configuration. Set AZURE_FOUNDRY_IMAGE_ENDPOINT, AZURE_FOUNDRY_IMAGE_API_KEY, and AZURE_FOUNDRY_FLUX_DEPLOYMENT.',
            );
        }

        this.client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));
        this.logger.log(`AzureFoundryImage configured endpoint=${endpoint} deployment=${this.deployment ? this.deployment : '<none>'}`);
        if (endpoint.includes('/openai')) {
            this.logger.warn('Azure Foundry image endpoint contains "/openai" path — consider using the resource root URL without /openai/v1');
        }
    }

    async generateImages(
        userId: string,
        prompt: string,
        count: number = 1,
    ): Promise<string[]> {
        if (!prompt || prompt.trim().length === 0) {
            throw new Error('Image prompt cannot be empty');
        }

        const start = Date.now();

        try {
            const response = await this.client.getImages(this.deployment, prompt, {
                size: '1024x1024',
                n: count,
                responseFormat: 'url',
            });

            const latency = Date.now() - start;
            this.logger.log(
                `AzureFoundryImage generateImages completed for user=${userId} deployment=${this.deployment} latency=${latency}ms`,
            );

            const imageUrls = (response.data || [])
                .map((result: { url?: string }) => result.url)
                .filter((url): url is string => typeof url === 'string');

            if (!imageUrls.length) {
                throw new Error('Azure Foundry returned no image URLs');
            }

            this.logger.debug(`AzureFoundryImage returned ${imageUrls.length} image URL(s)`);
            return imageUrls;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown Azure Foundry image error';
            this.logger.error(`AzureFoundryImage failed: ${message}`);
            if (error && typeof error === 'object') {
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
            throw new Error(`AzureFoundryImage generation failed: ${message}`);
        }
    }
}
