import { useState, useEffect, useCallback } from 'react';
import { VoiceMeta } from '../types/voice.types';
import { getAvailableVoices, checkVoiceAvailability } from '../api/generateApi';

export const useAvailableVoices = (language: string) => {
  const [voices, setVoices] = useState<VoiceMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceMap, setVoiceMap] = useState<Record<string, VoiceMeta | null>>({});

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getAvailableVoices(language);
        setVoices(response.voices);

        // Build a map for quick availability checks
        const map: Record<string, VoiceMeta> = {};
        response.voices.forEach((v) => {
          map[v.id] = v;
        });
        setVoiceMap(map);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load voices';
        setError(message);
        setVoices([]);
        setVoiceMap({});
      } finally {
        setLoading(false);
      }
    };

    fetchVoices();
  }, [language]);

  /**
   * Check if a specific voice is available for current language
   */
  const isVoiceAvailable = (voiceId: string): boolean => {
    return voiceId in voiceMap && voiceMap[voiceId] !== null;
  };

  /**
   * Get metadata for a specific voice (or null if not available)
   */
  const getVoiceMetadata = (voiceId: string): VoiceMeta | null => {
    return voiceMap[voiceId] || null;
  };

  const batchValidateVoices = useCallback(
    async (voicesToValidate: VoiceMeta[]): Promise<Set<string>> => {
      if (voicesToValidate.length === 0) return new Set();
      try {
        const checks = await Promise.all(
          voicesToValidate.map((v) => checkVoiceAvailability(v.id, language)),
        );
        const validVoices = new Set(
          checks
            .filter((check) => check.available)
            .map((check) => check.voiceId),
        );
        return validVoices;
      } catch (err) {
        console.error('Error during batch voice validation:', err);
        return new Set();
      }
    },
    [language],
  );

  return { voices, loading, error, isVoiceAvailable, getVoiceMetadata, batchValidateVoices };
};
