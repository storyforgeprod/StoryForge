import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ElevenLabsOptions {
  voiceId?: string;
  stability?: number;
  similarityBoost?: number;
}

@Injectable()
export class ElevenLabsService {
  private readonly logger = new Logger(ElevenLabsService.name);
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.elevenlabs.io/v1';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get('ELEVENLABS_API_KEY', '');
    if (!this.apiKey) {
      this.logger.warn(
        '⚠️ ELEVENLABS_API_KEY not configured. Audio generation will fail.',
      );
    }
  }

  async generateAudio(
    text: string,
    options?: ElevenLabsOptions,
  ): Promise<string> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    const voiceId = options?.voiceId || 'EXAVITQu4vr4xnSDxMaL'; // Default: Sarah
    const url = `${this.apiUrl}/text-to-speech/${voiceId}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.substring(0, 3000), // ElevenLabs limit per request
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: options?.stability ?? 0.5,
            similarity_boost: options?.similarityBoost ?? 0.75,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(
          `ElevenLabs API error: ${response.status} - ${error}`,
        );
        throw new Error(`ElevenLabs API failed: ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();

      // For now, return base64 encoded audio
      // In production, upload to storage and return URL
      const base64 = Buffer.from(audioBuffer).toString('base64');
      return `data:audio/mpeg;base64,${base64}`;
    } catch (error) {
      this.logger.error('ElevenLabs error:', error);
      throw error;
    }
  }
}
