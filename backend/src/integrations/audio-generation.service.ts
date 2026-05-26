import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { ElevenLabsService } from './elevenlabs.service';

@Injectable()
export class AudioGenerationService {
  private readonly logger = new Logger(AudioGenerationService.name);

  constructor(
    private readonly elevenLabsService: ElevenLabsService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Método principal: Intenta ElevenLabs, si falla va a Azure Speech Nativo
   */
  async generateTextToSpeech(
    text: string,
    voiceId?: string,
  ): Promise<string> {
    try {
      this.logger.log('🎙️ [Plan A] Intentando generar audio con ElevenLabs...');
      return await this.elevenLabsService.generateAudio(text, { voiceId });
    } catch (elevenLabsError: unknown) {
      const errorMsg = elevenLabsError instanceof Error ? elevenLabsError.message : String(elevenLabsError);
      this.logger.warn(
        `⚠️ [Plan A] ElevenLabs falló: ${errorMsg}. Iniciando Fallback a Azure Speech...`,
      );

      try {
        return await this.generateWithAzureSpeechNativo(text);
      } catch (azureError: unknown) {
        const azureMsg = azureError instanceof Error ? azureError.message : String(azureError);
        this.logger.error(
          `❌ [Plan B] Azure Speech también falló: ${azureMsg}`,
        );
        throw new Error('Servicio de Text-to-Speech no disponible temporalmente.');
      }
    }
  }

  /**
   * PLAN B: Azure Speech Services Nativo (Fallback)
   */
  private async generateWithAzureSpeechNativo(text: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const apiKey = this.configService.get('AZURE_SPEECH_API_KEY');
      const region = this.configService.get('AZURE_SPEECH_REGION');

      if (!apiKey || !region) {
        reject(
          new Error(
            'Azure Speech credentials not configured (AZURE_SPEECH_API_KEY, AZURE_SPEECH_REGION)',
          ),
        );
        return;
      }

      // 1. Configurar credenciales nativas de Azure
      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
        apiKey,
        region,
      );

      // 2. Formato de salida: MP3 de alta calidad
      speechConfig.speechSynthesisOutputFormat =
        SpeechSDK.SpeechSynthesisOutputFormat.Audio24Khz160KBitRateMonoMp3;

      // 3. Voz: es-MX-DaliaNeural (español mexicano, neutral, muy expresiva)
      speechConfig.speechSynthesisVoiceName = 'es-MX-DaliaNeural';

      // 4. Crear sintetizador con salida a memoria
      const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, null);

      this.logger.log('🔊 [Plan B] Sintetizando con Azure Speech...');

      synthesizer.speakTextAsync(
        text,
        (result: SpeechSDK.SpeechSynthesisResult) => {
          if (
            result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted
          ) {
            synthesizer.close();
            const audioBuffer = Buffer.from(result.audioData);
            const base64 = audioBuffer.toString('base64');
            this.logger.log('✅ [Plan B] Audio generado con Azure Speech');
            resolve(`data:audio/mpeg;base64,${base64}`);
          } else {
            synthesizer.close();
            reject(
              new Error(`Azure Speech falló: ${result.errorDetails || 'Unknown error'}`),
            );
          }
        },
        (error: string) => {
          synthesizer.close();
          reject(new Error(error));
        },
      );
    });
  }
}
