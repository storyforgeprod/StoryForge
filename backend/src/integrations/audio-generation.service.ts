import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { AzureTTSService } from './azure-tts.service';

@Injectable()
export class AudioGenerationService {
  private readonly logger = new Logger(AudioGenerationService.name);

  constructor(
    private readonly azureTTSService: AzureTTSService,
    private readonly configService: ConfigService,
  ) {}

  async generateTextToSpeech(text: string, voiceId?: string): Promise<string> {
    const voice = voiceId || 'alloy';

    try {
      this.logger.log('🎙️ [Plan A] Generating audio with Azure TTS...');
      return await this.azureTTSService.synthesize(text, voice);
    } catch (planAError: unknown) {
      const errorMsg = planAError instanceof Error ? planAError.message : String(planAError);
      this.logger.warn(`⚠️ [Plan A] Azure TTS failed: ${errorMsg}. Falling back to Azure Speech...`);

      try {
        return await this.generateWithAzureSpeechNativo(text);
      } catch (azureError: unknown) {
        const azureMsg = azureError instanceof Error ? azureError.message : String(azureError);
        this.logger.error(`❌ [Plan B] Azure Speech also failed: ${azureMsg}`);
        throw new Error('Servicio de Text-to-Speech no disponible temporalmente.');
      }
    }
  }

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

      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(apiKey, region);
      speechConfig.speechSynthesisOutputFormat =
        SpeechSDK.SpeechSynthesisOutputFormat.Audio24Khz160KBitRateMonoMp3;
      speechConfig.speechSynthesisVoiceName = 'es-MX-DaliaNeural';

      const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, null);
      this.logger.log('🔊 [Plan B] Synthesizing with Azure Speech...');

      synthesizer.speakTextAsync(
        text,
        (result: SpeechSDK.SpeechSynthesisResult) => {
          if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
            synthesizer.close();
            const audioBuffer = Buffer.from(result.audioData);
            const base64 = audioBuffer.toString('base64');
            this.logger.log('✅ [Plan B] Audio generated with Azure Speech');
            resolve(`data:audio/mpeg;base64,${base64}`);
          } else {
            synthesizer.close();
            reject(new Error(`Azure Speech failed: ${result.errorDetails || 'Unknown error'}`));
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
