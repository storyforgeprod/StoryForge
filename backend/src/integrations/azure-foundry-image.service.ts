import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * AzureFoundryImageService: FLUX.2-pro image generation
 * Uses native Foundry API (not OpenAI SDK)
 * Returns base64 encoded images
 */
@Injectable()
export class AzureFoundryImageService {
  private readonly logger = new Logger(AzureFoundryImageService.name);

  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly deployment: string;

  constructor(private readonly configService: ConfigService) {
    this.endpoint = this.configService.get<string>('AZURE_FOUNDRY_IMAGE_ENDPOINT', '');
    this.apiKey = this.configService.get<string>('AZURE_FOUNDRY_IMAGE_API_KEY', '');
    this.deployment = this.configService.get<string>('AZURE_FOUNDRY_FLUX_DEPLOYMENT', 'FLUX.2-pro');

    if (!this.endpoint || !this.apiKey) {
      this.logger.warn(
        'Missing Azure Foundry configuration. Set AZURE_FOUNDRY_IMAGE_ENDPOINT and AZURE_FOUNDRY_IMAGE_API_KEY.',
      );
    }

    this.logger.log(
      `AzureFoundryImage configured endpoint=${this.endpoint} deployment=${this.deployment}`,
    );
  }

  async generateImages(userId: string, prompt: string, count: number = 1): Promise<string[]> {
    if (!prompt?.trim()) {
      throw new Error('Image prompt cannot be empty');
    }

    const start = Date.now();
    this.logger.log(`Generating FLUX image for user=${userId} count=${count}`);
    this.logger.debug(`FLUX prompt preview: ${prompt.substring(0, 150)}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);

    try {
      const url =
        `${this.endpoint}/providers/blackforestlabs/v1/flux-2-pro` +
        `?api-version=preview`;

      const response = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          prompt,
          model: this.deployment,
          width: 1024,
          height: 1024,
          n: count,
        }),
      });

      const json = await response.json() as any;

      if (!response.ok) {
        this.logger.error(`FLUX request failed status=${response.status}`);
        this.logger.debug(`FLUX error response: ${JSON.stringify(json, null, 2)}`);
        throw new Error(json?.error?.message ?? 'FLUX generation failed');
      }

      const images: string[] =
        (json?.data as Array<{ b64_json?: string }>)
          ?.map((item) => item.b64_json)
          .filter((b): b is string => !!b) ?? [];

      if (!images.length) {
        throw new Error('FLUX returned no images');
      }

      const latency = Date.now() - start;
      this.logger.log(`FLUX generation completed images=${images.length} latency=${latency}ms`);

      // Convert base64 to data URLs for direct rendering
      return images.map((base64: string) => `data:image/png;base64,${base64}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`FLUX failed: ${message}`);
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

