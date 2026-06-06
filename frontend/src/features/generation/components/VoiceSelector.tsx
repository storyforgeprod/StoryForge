import { useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { VoiceOption } from '../types';

export type VoiceSelectorProps = {
    value: string | null;
    onChange: (voiceId: string) => void;
    disabled?: boolean;
};

type VoiceMeta = VoiceOption & { tag: string };

const VOICE_OPTIONS: VoiceMeta[] = [
    {
        id: 'EXAVITQu4vr4xnSDxMaL',
        name: 'Sarah',
        tag: 'Cálida',
        description: 'Voz femenina, cálida y dramática',
        previewUrl: '',
    },
    {
        id: 'TX3LPaxmHKxFdv7VOQHJ',
        name: 'Liam',
        tag: 'Épica',
        description: 'Voz masculina, épica y profunda',
        previewUrl: '',
    },
];

const EQ_DELAYS = [
    '[animation-delay:0s]',
    '[animation-delay:.1s]',
    '[animation-delay:.25s]',
    '[animation-delay:.15s]',
    '[animation-delay:.32s]',
    '[animation-delay:.05s]',
    '[animation-delay:.22s]',
];

export const VoiceSelector = ({
    value,
    onChange,
    disabled = false,
}: VoiceSelectorProps) => {
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [errorIds, setErrorIds] = useState<Set<string>>(new Set());
    const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

    const handlePlay = (id: string) => {
        const audio = audioRefs.current[id];
        if (!audio) return;
        if (playingId === id) {
            audio.pause();
            audio.currentTime = 0;
            setPlayingId(null);
        } else {
            Object.entries(audioRefs.current).forEach(([otherId, otherAudio]) => {
                if (otherId !== id && otherAudio) {
                    otherAudio.pause();
                    otherAudio.currentTime = 0;
                }
            });
            setPlayingId(id);
            audio.play().catch(() => {
                setErrorIds((prev) => new Set(prev).add(id));
                setPlayingId(null);
            });
        }
    };

    return (
        <RadioGroup
            value={value ?? undefined}
            onValueChange={onChange}
            disabled={disabled}
            aria-label="Select voice"
            className="flex flex-col gap-2.5"
        >
            {VOICE_OPTIONS.map((option) => {
                const id = `voice-${option.id}`;
                const isChecked = value === option.id;
                const isPlaying = playingId === option.id;
                return (
                    <div
                        key={option.id}
                        className={cn(
                            'flex items-center gap-3.5 rounded-xl border p-4 transition-all',
                            isChecked
                                ? 'border-primary bg-acc-soft shadow-[0_0_0_1px_var(--primary)]'
                                : 'border-border bg-card hover:border-bd2',
                            disabled && 'cursor-not-allowed opacity-50',
                        )}
                    >
                        <button
                            type="button"
                            onClick={() => handlePlay(option.id)}
                            aria-label={`${isPlaying ? 'Pausar' : 'Reproducir'} ${option.name}`}
                            className={cn(
                                'grid h-11 w-11 flex-none place-items-center rounded-full border transition',
                                isPlaying
                                    ? 'border-transparent bg-primary text-on-acc'
                                    : 'border-border bg-elev text-foreground hover:border-transparent hover:bg-primary hover:text-on-acc',
                            )}
                        >
                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </button>

                        <Label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
                            <span className="flex items-center gap-2 text-[14.5px] font-bold text-foreground">
                                {option.name}
                                <span className="rounded-full bg-elev2 px-[7px] py-0.5 text-[10.5px] font-semibold text-muted-foreground">
                                    {option.tag}
                                </span>
                            </span>
                            <span className="mt-0.5 block text-[12.5px] text-mut2">{option.description}</span>
                            {errorIds.has(option.id) && (
                                <span className="mt-1 block text-xs text-destructive">
                                    No se pudo cargar el audio
                                </span>
                            )}
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

                        <RadioGroupItem
                            id={id}
                            value={option.id}
                            aria-label={option.name}
                            className="h-[22px] w-[22px] flex-none"
                        />
                        <audio
                            ref={(el) => {
                                audioRefs.current[option.id] = el;
                            }}
                            src={option.previewUrl || undefined}
                            onEnded={() => setPlayingId(null)}
                            onError={() => {
                                setErrorIds((prev) => new Set(prev).add(option.id));
                                setPlayingId(null);
                            }}
                        />
                    </div>
                );
            })}
        </RadioGroup>
    );
};
