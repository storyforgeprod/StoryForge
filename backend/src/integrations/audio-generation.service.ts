import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { AzureTTSService } from './azure-tts.service';
import { VoiceCatalogService } from './voice-catalog.service';

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
    private readonly voiceCatalogService: VoiceCatalogService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get Azure Speech neural voice for given language
   */
  private getVoiceForLanguage(language: string): string {
    return LANGUAGE_VOICE_MAP[language] || LANGUAGE_VOICE_MAP['en'];
  }

  /**
   * Test if a voice is actually available by attempting real synthesis with minimal text
   * Returns { provider, success } if successful, throws error if both plans fail
   * @internal Used by checkVoiceAvailability for real-world service health testing
   */
  async testVoiceSynthesis(
    voiceId: string,
    language: string,
    attemptedProvider?: 'azure-tts' | 'azure-speech',
  ): Promise<{ provider: 'azure-tts' | 'azure-speech'; testedAt: string }> {
    const testText = '.'; // Minimal text for fastest test
    const voiceMeta = this.voiceCatalogService.getVoice(voiceId, language);

    if (!voiceMeta) {
      throw new Error(`Voice "${voiceId}" not found in catalog for language "${language}"`);
    }

    // Determine which provider to test
    const providersToTest: Array<'azure-tts' | 'azure-speech'> = [];

    if (attemptedProvider) {
      // If a specific provider was attempted and failed, start with Plan B
      providersToTest.push(attemptedProvider === 'azure-tts' ? 'azure-speech' : 'azure-tts');
      providersToTest.push(attemptedProvider);
    } else {
      // Test Plan A first, then Plan B
      providersToTest.push('azure-tts', 'azure-speech');
    }

    let lastError: Error | null = null;

    for (const provider of providersToTest) {
      try {
        if (provider === 'azure-tts') {
          this.logger.log(
            `🧪 [Test] Testing Plan A (Azure TTS) voice: ${voiceId} for language: ${language}`,
          );
          await this.azureTTSService.synthesize(testText, voiceId, language);
          this.logger.log(`✅ [Test] Plan A test PASSED for voice: ${voiceId}`);
          return { provider: 'azure-tts', testedAt: new Date().toISOString() };
        } else {
          this.logger.log(
            `🧪 [Test] Testing Plan B (Azure Speech) voice: ${voiceId} for language: ${language}`,
          );
          await this.generateWithAzureSpeechNativo(testText, language, voiceId);
          this.logger.log(`✅ [Test] Plan B test PASSED for voice: ${voiceId}`);
          return { provider: 'azure-speech', testedAt: new Date().toISOString() };
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const planName = provider === 'azure-tts' ? 'Plan A' : 'Plan B';
        this.logger.warn(
          `❌ [Test] ${planName} test FAILED for voice: ${voiceId} - ${lastError.message}`,
        );
      }
    }

    // Both plans failed
    throw new Error(
      `Voice "${voiceId}" failed testing on all providers. Last error: ${lastError?.message || 'Unknown'}`,
    );
  }

  async generateTextToSpeech(
    text: string,
    language: string = 'en',
    voiceId?: string,
    voiceProvider?: 'azure-tts' | 'azure-speech',
  ): Promise<string> {
    // Defensive: Validate voice exists in catalog BEFORE attempting synthesis
    if (voiceId) {
      const voiceMeta = this.voiceCatalogService.getVoice(voiceId, language);
      if (!voiceMeta) {
        const msg = `🚫 [Validation] Voice "${voiceId}" not available for language "${language}"`;
        this.logger.error(msg);
        throw new Error(msg);
      }
      this.logger.log(
        `✓ [Validation] Voice "${voiceId}" (${voiceMeta.provider}) available for language "${language}"`,
      );
    }

    // Determine which provider to use
    const provider =
      voiceProvider ||
      this.voiceCatalogService.getVoiceProvider(voiceId || '', language);

    // If Plan A (Azure TTS) is requested, try it first with fallback to Plan B
    if (provider === 'azure-tts') {
      try {
        this.logger.log(
          `🎙️ [Plan A] Generating audio with Azure TTS (voice: ${voiceId}, language: ${language})...`,
        );
        return await this.azureTTSService.synthesize(text, voiceId, language);
      } catch (planAError: unknown) {
        const errorMsg =
          planAError instanceof Error ? planAError.message : String(planAError);
        this.logger.warn(
          `⚠️ [Plan A] Azure TTS failed: ${errorMsg}. Checking Plan B availability...`,
        );

        // Before attempting fallback, validate that voiceId exists in Plan B catalog
        if (voiceId) {
          const voiceInPlanB = this.voiceCatalogService.getVoice(
            voiceId,
            language,
          );
          if (!voiceInPlanB || voiceInPlanB.provider !== 'azure-speech') {
            const msg = `❌ [Fallback] Voice "${voiceId}" exists only in Plan A but Plan A failed. No Plan B fallback available for language "${language}"`;
            this.logger.error(msg);
            throw new Error(msg);
          }
        }

        this.logger.log(
          `↪️ [Fallback] Attempting Plan B (Azure Speech) with voice: ${voiceId}...`,
        );
        return await this.generateWithAzureSpeechNativo(
          text,
          language,
          voiceId,
        );
      }
    } else {
      // Plan B (Azure Speech) direct
      return await this.generateWithAzureSpeechNativo(
        text,
        language,
        voiceId,
      );
    }
  }

  private async generateWithAzureSpeechNativo(
    text: string,
    language: string = 'en',
    voiceId?: string,
  ): Promise<string> {
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

      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
        apiKey,
        region,
      );
      speechConfig.speechSynthesisOutputFormat =
        SpeechSDK.SpeechSynthesisOutputFormat.Audio24Khz160KBitRateMonoMp3;

      // Use provided voiceId, or map language to default
      const voiceName =
        voiceId || this.getVoiceForLanguage(language);
      speechConfig.speechSynthesisVoiceName = voiceName;

      this.logger.log(
        `🔊 [Plan B] Synthesizing with Azure Speech (voice: ${voiceName}, language: ${language})...`,
      );

      const synthesizer = new SpeechSDK.SpeechSynthesizer(
        speechConfig,
        null,
      );

      synthesizer.speakTextAsync(
        text,
        (result: SpeechSDK.SpeechSynthesisResult) => {
          if (
            result.reason ===
            SpeechSDK.ResultReason.SynthesizingAudioCompleted
          ) {
            synthesizer.close();
            const audioBuffer = Buffer.from(result.audioData);
            const base64 = audioBuffer.toString('base64');
            this.logger.log('✅ [Plan B] Audio generated with Azure Speech');
            resolve(`data:audio/mpeg;base64,${base64}`);
          } else {
            synthesizer.close();
            reject(
              new Error(
                `Azure Speech failed: ${result.errorDetails || 'Unknown error'}`,
              ),
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
