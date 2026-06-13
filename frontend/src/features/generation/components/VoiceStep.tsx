import { useRef, useState } from 'react';
import { Pause, Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useAvailableVoices } from '../hooks/useAvailableVoices';
import { VoiceMeta } from '../types/voice.types';
import { getVoiceSample } from '../api/generateApi';

const EQ_DELAYS = ['[animation-delay:0s]','[animation-delay:.1s]','[animation-delay:.25s]','[animation-delay:.15s]','[animation-delay:.32s]','[animation-delay:.05s]','[animation-delay:.22s]'];

export type VoiceStepProps = {
  value: string | null;
  language?: string;
  onChange: (voiceId: string) => void;
  onContinue: () => void;
};

export const VoiceStep = ({ value, language = 'en', onChange, onContinue }: VoiceStepProps) => {
  const { voices, loading, error } = useAvailableVoices(language);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [sampleLoading, setSampleLoading] = useState<string | null>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
  const audioUrlCache = useRef<Record<string, string>>({});

  const handlePlay = async (voice: VoiceMeta) => {
    const audio = audioRefs.current[voice.id];
    if (!audio) return;

    if (playingId === voice.id) {
      audio.pause();
      audio.currentTime = 0;
      setPlayingId(null);
      return;
    }

    try {
      setSampleLoading(voice.id);

      // Check cache first
      if (audioUrlCache.current[voice.id]) {
        audio.src = audioUrlCache.current[voice.id];
        Object.values(audioRefs.current).forEach((a) => { if (a) { a.pause(); a.currentTime = 0; } });
        setPlayingId(voice.id);
        audio.play().catch(() => setPlayingId(null));
        return;
      }

      // Fetch sample from API
      const sample = await getVoiceSample(voice.id, language, voice.provider);
      audioUrlCache.current[voice.id] = sample.audioUrl;
      audio.src = sample.audioUrl;

      Object.values(audioRefs.current).forEach((a) => { if (a) { a.pause(); a.currentTime = 0; } });
      setPlayingId(voice.id);
      audio.play().catch(() => setPlayingId(null));
    } catch (err) {
      console.error(`Failed to load voice sample for ${voice.id}:`, err);
      setPlayingId(null);
    } finally {
      setSampleLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading voices...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-head text-[32px] font-extrabold tracking-[-0.04em]">Choose a voice</h1>
          <p className="mt-1.5 text-[14px] text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  if (voices.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-head text-[32px] font-extrabold tracking-[-0.04em]">Choose a voice</h1>
          <p className="mt-1.5 text-[14px] text-muted-foreground">No voices available for this language.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-head text-[32px] font-extrabold tracking-[-0.04em]">Choose a voice</h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">Press play to preview, then select your narrator.</p>
      </div>

      <RadioGroup
        value={value ?? undefined}
        onValueChange={onChange}
        aria-label="Select voice"
        className="flex flex-col gap-2.5"
      >
        {voices.map((voice) => {
          const radioId = `voice-${voice.id}`;
          const isChecked = value === voice.id;
          const isPlaying = playingId === voice.id;
          const isLoadingSample = sampleLoading === voice.id;

          return (
            <div
              key={voice.id}
              className={cn(
                'flex items-center gap-3.5 rounded-xl border p-4 transition-all',
                isChecked
                  ? 'border-primary bg-acc-soft shadow-[0_0_0_1px_var(--primary)]'
                  : 'border-border bg-card hover:border-bd2',
              )}
            >
              <button
                type="button"
                onClick={() => handlePlay(voice)}
                disabled={isLoadingSample}
                aria-label={`${isPlaying ? 'Pause' : 'Play'} ${voice.name}`}
                className={cn(
                  'grid h-11 w-11 flex-none place-items-center rounded-full border transition disabled:opacity-50',
                  isPlaying
                    ? 'border-transparent bg-primary text-on-acc'
                    : 'border-border bg-elev text-foreground hover:border-transparent hover:bg-primary hover:text-on-acc',
                )}
              >
                {isLoadingSample ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </button>

              <Label htmlFor={radioId} className="min-w-0 flex-1 cursor-pointer">
                <span className="flex items-center gap-2 text-[14.5px] font-bold text-foreground">
                  {voice.name}
                  <span className="rounded-full bg-elev2 px-[7px] py-0.5 text-[10.5px] font-semibold text-muted-foreground">
                    {voice.tag}
                  </span>
                </span>
              </Label>

              <div
                className={cn('flex h-[26px] w-[78px] items-end gap-[3px] transition-opacity', isPlaying ? 'opacity-100' : 'opacity-25')}
                aria-hidden="true"
              >
                {EQ_DELAYS.map((delay, i) => (
                  <span key={i} className={cn('h-[30%] flex-1 rounded-[2px] bg-primary', isPlaying && `animate-eq ${delay}`)} />
                ))}
              </div>

              <RadioGroupItem id={radioId} value={voice.id} aria-label={voice.name} className="h-[22px] w-[22px] flex-none" />
              <audio
                ref={(el) => { audioRefs.current[voice.id] = el; }}
                onEnded={() => setPlayingId(null)}
              />
            </div>
          );
        })}
      </RadioGroup>

      <div className="flex justify-end">
        <Button disabled={!value} onClick={onContinue}>Continue</Button>
      </div>
    </div>
  );
};
