import { Injectable, Logger } from '@nestjs/common';
import { VoiceMeta } from './voice.types';

@Injectable()
export class VoiceCatalogService {
  private readonly logger = new Logger(VoiceCatalogService.name);

  // Azure Speech SDK Neural Voices (Plan B - Most Reliable)
  private AZURE_SPEECH_VOICES: Record<string, VoiceMeta[]> = {
    en: [
      {
        id: 'en-US-AriaNeural',
        name: 'Aria',
        provider: 'azure-speech',
        tag: 'Neutral',
      },
    ],
    es: [
      {
        id: 'es-MX-DaliaNeural',
        name: 'Dalia',
        provider: 'azure-speech',
        tag: 'Mexico',
      },
      {
        id: 'es-ES-AlvaroNeural',
        name: 'Álvaro',
        provider: 'azure-speech',
        tag: 'Spain',
      },
    ],
    pt: [
      {
        id: 'pt-BR-FranciscaNeural',
        name: 'Francisca',
        provider: 'azure-speech',
        tag: 'Brazil',
      },
    ],
    fr: [
      {
        id: 'fr-FR-DeniseNeural',
        name: 'Denise',
        provider: 'azure-speech',
        tag: 'France',
      },
    ],
  };

  // Azure TTS Voices (Plan A - OpenAI voices)
  private AZURE_TTS_VOICES: Record<string, VoiceMeta[]> = {
    en: [
      { id: 'alloy', name: 'Alloy', provider: 'azure-tts', tag: 'Balanced' },
      { id: 'echo', name: 'Echo', provider: 'azure-tts', tag: 'Cinematic' },
      { id: 'fable', name: 'Fable', provider: 'azure-tts', tag: 'Expressive' },
      { id: 'onyx', name: 'Onyx', provider: 'azure-tts', tag: 'Deep' },
      { id: 'nova', name: 'Nova', provider: 'azure-tts', tag: 'Energetic' },
      {
        id: 'shimmer',
        name: 'Shimmer',
        provider: 'azure-tts',
        tag: 'Soft',
      },
    ],
    es: [
      { id: 'nova', name: 'Nova', provider: 'azure-tts', tag: 'Energetic' },
    ],
    pt: [
      { id: 'nova', name: 'Nova', provider: 'azure-tts', tag: 'Energetic' },
    ],
    fr: [
      { id: 'nova', name: 'Nova', provider: 'azure-tts', tag: 'Energetic' },
    ],
  };

  /**
   * Get all available voices for a language from both Plan A and Plan B
   * Plan B (Azure Speech) comes first as it's more reliable
   * Max 10 voices per language
   */
  getVoicesByLanguage(language: string): VoiceMeta[] {
    const speechVoices =
      this.AZURE_SPEECH_VOICES[language] ||
      this.AZURE_SPEECH_VOICES['en'];
    const ttsVoices = this.AZURE_TTS_VOICES[language] || [];

    // Combine: Plan B first (more reliable), then Plan A
    const combined = [...speechVoices, ...ttsVoices];
    const voices = combined.slice(0, 10); // Max 10

    this.logger.log(
      `Voice catalog loaded: ${voices.length} voices for language=${language}`,
    );
    return voices;
  }

  /**
   * Get voice metadata by ID
   */
  getVoice(voiceId: string, language: string): VoiceMeta | null {
    const voices = this.getVoicesByLanguage(language);
    const voice = voices.find((v) => v.id === voiceId);
    return voice || null;
  }

  /**
   * Determine which provider should handle this voice
   */
  getVoiceProvider(
    voiceId: string,
    language: string,
  ): 'azure-tts' | 'azure-speech' {
    const voice = this.getVoice(voiceId, language);
    if (!voice) {
      this.logger.warn(
        `Voice ${voiceId} not found for language ${language}, defaulting to azure-speech`,
      );
      return 'azure-speech'; // Safe default
    }
    return voice.provider;
  }

  /**
   * Get default voice for a language (Plan B preferred)
   */
  getDefaultVoiceId(language: string): string {
    const voices = this.getVoicesByLanguage(language);
    return voices.length > 0 ? voices[0].id : 'en-US-AriaNeural';
  }
}
