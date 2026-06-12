import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AzureTTSService {
  private readonly logger = new Logger(AzureTTSService.name);
  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly apiVersion: string;
  private readonly deployment: string;

  constructor(private readonly configService: ConfigService) {
    this.endpoint = this.configService.get<string>('AZURE_OPENAI_ENDPOINT', '');
    this.apiKey = this.configService.get<string>('AZURE_OPENAI_API_KEY', '');
    this.apiVersion = this.configService.get<string>('AZURE_OPENAI_API_VERSION', '');
    this.deployment = this.configService.get<string>('AZURE_OPENAI_DEPLOYMENT_TTS', '');

    if (!this.deployment) {
      this.logger.warn('⚠️ AZURE_OPENAI_DEPLOYMENT_TTS not configured. Azure TTS will fail.');
    }
    this.logger.log(`AzureTTS configured endpoint=${this.endpoint} deployment=${this.deployment}`);
  }

  async synthesize(text: string, voiceId: string): Promise<string> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    const url =
      `${this.endpoint}/openai/deployments/${this.deployment}/audio/speech` +
      `?api-version=${this.apiVersion}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.deployment,
          input: text,
          voice: voiceId,
          response_format: 'mp3',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Azure TTS API error: ${response.status} - ${error}`);
        throw new Error(`Azure TTS API failed: ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(audioBuffer).toString('base64');
      return `data:audio/mpeg;base64,${base64}`;
    } finally {
      clearTimeout(timeout);
    }
  }
}
