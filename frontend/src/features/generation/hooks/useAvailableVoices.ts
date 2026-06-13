import { useState, useEffect } from 'react';
import { VoiceMeta } from '../types/voice.types';
import { getAvailableVoices } from '../api/generateApi';

export const useAvailableVoices = (language: string) => {
  const [voices, setVoices] = useState<VoiceMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getAvailableVoices(language);
        setVoices(response.voices);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load voices';
        setError(message);
        setVoices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVoices();
  }, [language]);

  return { voices, loading, error };
};
