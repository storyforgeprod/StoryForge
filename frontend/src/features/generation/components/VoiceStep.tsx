import { useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type VoiceMeta = {
  id: string;
  name: string;
  tag: string;
  description: string;
};

const VOICES: VoiceMeta[] = [
  { id: 'nova',  name: 'Nova',  tag: 'Energetic', description: 'Bright, fast — perfect for hooks' },
  { id: 'atlas', name: 'Atlas', tag: 'Deep',       description: 'Calm, cinematic narrator' },
  { id: 'lumi',  name: 'Lumi',  tag: 'Friendly',   description: 'Warm, conversational, gen-z' },
  { id: 'rex',   name: 'Rex',   tag: 'Hype',        description: 'Loud, punchy sports-caster' },
  { id: 'sage',  name: 'Sage',  tag: 'Soft',        description: 'Gentle ASMR-style whisper' },
];

const EQ_DELAYS = ['[animation-delay:0s]','[animation-delay:.1s]','[animation-delay:.25s]','[animation-delay:.15s]','[animation-delay:.32s]','[animation-delay:.05s]','[animation-delay:.22s]'];

export type VoiceStepProps = {
  value: string | null;
  onChange: (voiceId: string) => void;
  onContinue: () => void;
};

export const VoiceStep = ({ value, onChange, onContinue }: VoiceStepProps) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  const handlePlay = (id: string) => {
    const audio = audioRefs.current[id];
    if (!audio) return;
    if (playingId === id) {
      audio.pause();
      audio.currentTime = 0;
      setPlayingId(null);
    } else {
      Object.values(audioRefs.current).forEach((a) => { if (a) { a.pause(); a.currentTime = 0; } });
      setPlayingId(id);
      audio.play().catch(() => setPlayingId(null));
    }
  };

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
        {VOICES.map((voice) => {
          const radioId = `voice-${voice.id}`;
          const isChecked = value === voice.id;
          const isPlaying = playingId === voice.id;
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
                onClick={() => handlePlay(voice.id)}
                aria-label={`${isPlaying ? 'Pause' : 'Play'} ${voice.name}`}
                className={cn(
                  'grid h-11 w-11 flex-none place-items-center rounded-full border transition',
                  isPlaying
                    ? 'border-transparent bg-primary text-on-acc'
                    : 'border-border bg-elev text-foreground hover:border-transparent hover:bg-primary hover:text-on-acc',
                )}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>

              <Label htmlFor={radioId} className="min-w-0 flex-1 cursor-pointer">
                <span className="flex items-center gap-2 text-[14.5px] font-bold text-foreground">
                  {voice.name}
                  <span className="rounded-full bg-elev2 px-[7px] py-0.5 text-[10.5px] font-semibold text-muted-foreground">
                    {voice.tag}
                  </span>
                </span>
                <span className="mt-0.5 block text-[12.5px] text-mut2">{voice.description}</span>
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
                src={`/voices/${voice.id}.mp3`}
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
