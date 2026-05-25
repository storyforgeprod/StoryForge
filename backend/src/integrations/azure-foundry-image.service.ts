import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIClient } from '@azure/openai';
import { AzureKeyCredential } from '@azure/core-auth';
import util from 'util';

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

        this.logger.log(
            `AzureFoundryImage generateImages request for user=${userId} deployment=${this.deployment} count=${count}`,
        );
        this.logger.debug(`AzureFoundryImage prompt preview: ${prompt.substring(0, 200)}`);

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
            const message = error instanceof Error ? error.message : String(error ?? 'Unknown Azure Foundry image error');
            this.logger.error(`AzureFoundryImage failed: ${message}`);
            this.logger.debug(`[AzureFoundryImage] FULL ERROR for diagnostics:`, error);
            try {
                this.logger.debug(`Error details: ${util.inspect(error, { depth: 10 })}`);
            } catch (e) {
                this.logger.debug('Failed to inspect error object');
            }

            if (error && typeof error === 'object') {
                try {
                    // @ts-ignore
                    if (error.name) this.logger.debug(`name: ${error.name}`);
                    // @ts-ignore
                    if (error.statusCode) this.logger.debug(`statusCode: ${error.statusCode}`);
                    // @ts-ignore
                    if (error.code) this.logger.debug(`code: ${error.code}`);
                    // @ts-ignore
                    if (error.response) this.logger.debug(`response: ${util.inspect(error.response, { depth: 5 })}`);
                    // @ts-ignore
                    if (error.body) this.logger.debug(`body: ${util.inspect(error.body, { depth: 5 })}`);
                    // @ts-ignore
                    if (error.innerError) this.logger.debug(`innerError: ${util.inspect(error.innerError, { depth: 5 })}`);
                } catch (e) {
                    this.logger.debug('Failed to log error sub-properties');
                }
            }

            // Re-throw original error instead of wrapping (better for fallback chain)
            throw error;
        }
    }
}
