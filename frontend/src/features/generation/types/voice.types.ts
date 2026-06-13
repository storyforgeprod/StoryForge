export interface VoiceMeta {
  id: string;
  name: string;
  provider: 'azure-tts' | 'azure-speech';
  tag: string;
}

export interface AvailableVoicesResponse {
  language: string;
  voices: VoiceMeta[];
  count: number;
}

export interface VoiceSampleResponse {
  audioUrl: string;
  voiceId: string;
  language: string;
}
