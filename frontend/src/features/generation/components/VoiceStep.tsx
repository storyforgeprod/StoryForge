import { useRef, useState, useEffect } from 'react';
import { Pause, Play, Loader2, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useAvailableVoices } from '../hooks/useAvailableVoices';
import { VoiceMeta } from '../types/voice.types';
import { getVoiceSample, checkVoiceAvailability } from '../api/generateApi';

const EQ_DELAYS = ['[animation-delay:0s]','[animation-delay:.1s]','[animation-delay:.25s]','[animation-delay:.15s]','[animation-delay:.32s]','[animation-delay:.05s]','[animation-delay:.22s]'];

export type VoiceStepProps = {
  value: string | null;
  language?: string;
  onChange: (voiceId: string) => void;
  onContinue: () => void;
};

export const VoiceStep = ({ value, language = 'en', onChange, onContinue }: VoiceStepProps) => {
  const { voices, loading, error, isVoiceAvailable, batchValidateVoices } = useAvailableVoices(language);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [sampleLoading, setSampleLoading] = useState<string | null>(null);
  const [playError, setPlayError] = useState<{ voiceId: string; message: string } | null>(null);
  const [preValidatedVoices, setPreValidatedVoices] = useState<Set<string>>(new Set());
  const [isValidating, setIsValidating] = useState(false);
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
  const audioUrlCache = useRef<Record<string, string>>({});

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (!playError) return;
    const timer = setTimeout(() => setPlayError(null), 5000);
    return () => clearTimeout(timer);
  }, [playError]);

  // Batch validate all voices on load or language change
  useEffect(() => {
    if (voices.length === 0) {
      setPreValidatedVoices(new Set());
      return;
    }

    const validateAll = async () => {
      setIsValidating(true);
      try {
        const validVoices = await batchValidateVoices(voices);
        setPreValidatedVoices(validVoices);

        // If selected voice is no longer valid, clear selection
        if (value && !validVoices.has(value)) {
          onChange('');
        }
      } finally {
        setIsValidating(false);
      }
    };

    validateAll();
  }, [voices, language, batchValidateVoices]);

  const handleContinue = () => {
    if (!value) return;

    // Double-check that selected voice is still valid (defensive guardrail)
    if (!preValidatedVoices.has(value)) {
      setPlayError({
        voiceId: value,
        message: '⚠️ Selected voice is no longer available. Please choose another.',
      });
      onChange('');
      return;
    }

    onContinue();
  };

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
      setPlayError(null);

      // Step 1: Pre-validate voice availability before attempting synthesis
      const availabilityCheck = await checkVoiceAvailability(voice.id, language);
      if (!availabilityCheck.available) {
        setPlayError({
          voiceId: voice.id,
          message: `⚠️ ${availabilityCheck.message}`,
        });
        // Remove from pre-validated if it fails
        setPreValidatedVoices((prev) => {
          const next = new Set(prev);
          next.delete(voice.id);
          return next;
        });
        // Clear selection if user had selected this voice
        if (value === voice.id) {
          onChange('');
        }
        console.warn(`Voice ${voice.id} not available for ${language}:`, availabilityCheck.message);
        setSampleLoading(null);
        return;
      }

      // Step 2: Check cache first
      if (audioUrlCache.current[voice.id]) {
        audio.src = audioUrlCache.current[voice.id];
        Object.values(audioRefs.current).forEach((a) => { if (a) { a.pause(); a.currentTime = 0; } });
        setPlayingId(voice.id);
        audio.play().catch(() => setPlayingId(null));
        return;
      }

      // Step 3: Fetch sample from API
      const sample = await getVoiceSample(voice.id, language, voice.provider);
      audioUrlCache.current[voice.id] = sample.audioUrl;
      audio.src = sample.audioUrl;

      Object.values(audioRefs.current).forEach((a) => { if (a) { a.pause(); a.currentTime = 0; } });
      setPlayingId(voice.id);
      audio.play().catch(() => setPlayingId(null));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load voice sample';
      setPlayError({
        voiceId: voice.id,
        message: `❌ ${errorMsg}`,
      });
      // Remove from pre-validated if it fails
      setPreValidatedVoices((prev) => {
        const next = new Set(prev);
        next.delete(voice.id);
        return next;
      });
      // Clear selection if user had selected this voice
      if (value === voice.id) {
        onChange('');
      }
      console.error(`Failed to load voice sample for ${voice.id}:`, err);
      setPlayingId(null);
    } finally {
      setSampleLoading(null);
    }
  };

  if (loading || isValidating) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{isValidating ? 'Checking voice availability...' : 'Loading voices...'}</p>
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
          const isAvailable = isVoiceAvailable(voice.id);
          const isPreValidated = preValidatedVoices.has(voice.id);
          const isSelectable = isAvailable && isPreValidated;
          const hasError = playError?.voiceId === voice.id;

          return (
            <div key={voice.id} className="group relative">
              {/* Error banner */}
              {hasError && (
                <div className="mb-2 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1">{playError.message}</span>
                  <button
                    type="button"
                    onClick={() => setPlayError(null)}
                    className="flex-shrink-0 opacity-70 hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div
                className={cn(
                  'flex items-center gap-3.5 rounded-xl border p-4 transition-all',
                  !isSelectable && 'opacity-50 cursor-not-allowed pointer-events-none',
                  isChecked
                    ? 'border-primary bg-acc-soft shadow-[0_0_0_1px_var(--primary)]'
                    : 'border-border bg-card hover:border-bd2',
                  !isSelectable && 'border-muted-foreground/50',
                )}
              >
                <button
                  type="button"
                  onClick={() => isSelectable && handlePlay(voice)}
                  disabled={isLoadingSample || !isSelectable}
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

                <Label
                  htmlFor={isSelectable ? radioId : undefined}
                  className={cn(
                    'min-w-0 flex-1',
                    isSelectable ? 'cursor-pointer' : 'cursor-not-allowed',
                  )}
                >
                  <span className="flex items-center gap-2 text-[14.5px] font-bold text-foreground">
                    {voice.name}
                    <span className="rounded-full bg-elev2 px-[7px] py-0.5 text-[10.5px] font-semibold text-muted-foreground">
                      {voice.tag}
                    </span>
                    {!isSelectable && (
                      <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </span>
                </Label>

                <div
                  className={cn(
                    'flex h-[26px] w-[78px] items-end gap-[3px] transition-opacity',
                    isPlaying ? 'opacity-100' : 'opacity-25',
                  )}
                  aria-hidden="true"
                >
                  {EQ_DELAYS.map((delay, i) => (
                    <span
                      key={i}
                      className={cn(
                        'h-[30%] flex-1 rounded-[2px] bg-primary',
                        isPlaying && `animate-eq ${delay}`,
                      )}
                    />
                  ))}
                </div>

                {isSelectable ? (
                  <RadioGroupItem
                    id={radioId}
                    value={voice.id}
                    aria-label={voice.name}
                    className="h-[22px] w-[22px] flex-none"
                  />
                ) : (
                  <div className="h-[22px] w-[22px] flex-none" />
                )}

                <audio
                  ref={(el) => {
                    audioRefs.current[voice.id] = el;
                  }}
                  onEnded={() => setPlayingId(null)}
                />
              </div>

              {!isSelectable && (
                <div className="absolute -top-8 left-4 hidden group-hover:block bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                  {!isPreValidated ? 'Not available for this language' : 'Failed to load'}
                </div>
              )}
            </div>
          );
        })}
      </RadioGroup>

      <div className="flex justify-end">
        <Button disabled={!value || !preValidatedVoices.has(value ?? '')} onClick={handleContinue}>Continue</Button>
      </div>
    </div>
  );
};
