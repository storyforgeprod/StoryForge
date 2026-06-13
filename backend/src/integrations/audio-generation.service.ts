import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { AzureTTSService } from './azure-tts.service';

// Map language codes to Azure Speech neural voices
const LANGUAGE_VOICE_MAP: Record<string, string> = {
  'en': 'en-US-AriaNeural',        // English (US)
  'es': 'es-MX-DaliaNeural',       // Spanish (Mexico)
  'es-MX': 'es-MX-DaliaNeural',    // Spanish (Mexico)
  'es-ES': 'es-ES-AlvaroNeural',   // Spanish (Spain)
  'pt': 'pt-BR-FranciscaNeural',   // Portuguese (Brazil)
  'pt-BR': 'pt-BR-FranciscaNeural',// Portuguese (Brazil)
  'fr': 'fr-FR-DeniseNeural',      // French (France)
  'fr-FR': 'fr-FR-DeniseNeural',   // French (France)
  'de': 'de-DE-BertaNeural',       // German (Germany)
  'de-DE': 'de-DE-BertaNeural',    // German (Germany)
  'it': 'it-IT-IsabellaNeural',    // Italian (Italy)
  'it-IT': 'it-IT-IsabellaNeural', // Italian (Italy)
  'ja': 'ja-JP-NanamiNeural',      // Japanese (Japan)
  'ja-JP': 'ja-JP-NanamiNeural',   // Japanese (Japan)
  'zh': 'zh-CN-XiaoxuanNeural',    // Chinese (Simplified)
  'zh-CN': 'zh-CN-XiaoxuanNeural', // Chinese (Simplified)
};

@Injectable()
export class AudioGenerationService {
  private readonly logger = new Logger(AudioGenerationService.name);

  constructor(
    private readonly azureTTSService: AzureTTSService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get Azure Speech neural voice for given language
   */
  private getVoiceForLanguage(language: string): string {
    return LANGUAGE_VOICE_MAP[language] || LANGUAGE_VOICE_MAP['en'];
  }

  async generateTextToSpeech(text: string, language: string = 'en', voiceId?: string): Promise<string> {
    try {
      this.logger.log(`🎙️ [Plan A] Generating audio with Azure TTS (${language})...`);
      return await this.azureTTSService.synthesize(text, voiceId, language);
    } catch (planAError: unknown) {
      const errorMsg = planAError instanceof Error ? planAError.message : String(planAError);
      this.logger.warn(`⚠️ [Plan A] Azure TTS failed: ${errorMsg}. Falling back to Azure Speech...`);

      try {
        return await this.generateWithAzureSpeechNativo(text, language);
      } catch (azureError: unknown) {
        const azureMsg = azureError instanceof Error ? azureError.message : String(azureError);
        this.logger.error(`❌ [Plan B] Azure Speech also failed: ${azureMsg}`);
        throw new Error('Servicio de Text-to-Speech no disponible temporalmente.');
      }
    }
  }

  private async generateWithAzureSpeechNativo(text: string, language: string = 'en'): Promise<string> {
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
      
      // Select voice based on language
      const voiceName = this.getVoiceForLanguage(language);
      speechConfig.speechSynthesisVoiceName = voiceName;
      
      this.logger.log(`🔊 [Plan B] Synthesizing with Azure Speech (${language} → ${voiceName})...`);

      const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, null);

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
