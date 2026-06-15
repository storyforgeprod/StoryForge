import { Injectable } from '@nestjs/common';

const VOICE_MAP: Record<string, string> = {
  nova:  'EXAVITQu4vr4xnSDxMaL',
  atlas: 'TX3LPaxmHKxFdv7VOQHJ',
  lumi:  'pFZP5JQG7iQjIQuC4Bku',
  rex:   'bIHbv24MWmeRgasZH58o',
  sage:  'cgSgspJ2msm6clMCkdW9',
};

@Injectable()
export class ElevenLabsService {
  resolveVoiceId(internalId: string): string {
    return VOICE_MAP[internalId] ?? internalId;
  }

  async synthesizeAudio(text: string, voiceId: string = 'nova'): Promise<Buffer> {
    const resolvedId = this.resolveVoiceId(voiceId);
    console.log(`[STUB] Synthesizing audio with voice: ${resolvedId}`);
    return Buffer.from('');
  }

  async getAvailableVoices(): Promise<{ id: string; name: string }[]> {
    return Object.keys(VOICE_MAP).map((id) => ({ id, name: id }));
  }
}
