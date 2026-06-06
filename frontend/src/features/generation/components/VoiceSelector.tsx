import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { VoiceOption } from '../types';

export type VoiceSelectorProps = {
    value: string | null;
    onChange: (voiceId: string) => void;
    disabled?: boolean;
};

const VOICE_OPTIONS: VoiceOption[] = [
    {
        id: 'EXAVITQu4vr4xnSDxMaL',
        name: 'Sarah',
        description: 'Voz femenina, cálida y dramática',
        previewUrl: '',
    },
    {
        id: 'TX3LPaxmHKxFdv7VOQHJ',
        name: 'Liam',
        description: 'Voz masculina, épica y profunda',
        previewUrl: '',
    },
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
            className="flex flex-col gap-3"
        >
            {VOICE_OPTIONS.map((option) => {
                const id = `voice-${option.id}`;
                const isChecked = value === option.id;
                return (
                    <div
                        key={option.id}
                        className={cn(
                            'flex items-center gap-4 rounded-lg border-2 p-4 transition-all',
                            isChecked
                                ? 'border-primary ring-2 ring-primary ring-offset-2'
                                : 'border-border hover:border-primary/50',
                            disabled ? 'cursor-not-allowed opacity-50' : 'hover:shadow-md',
                        )}
                    >
                        <RadioGroupItem
                            id={id}
                            value={option.id}
                            aria-label={option.name}
                            className="shrink-0"
                        />
                        <Label htmlFor={id} className="flex-1 cursor-pointer">
                            <div className="font-semibold text-foreground">{option.name}</div>
                            <div className="text-sm text-muted-foreground">{option.description}</div>
                            {errorIds.has(option.id) && (
                                <div className="mt-1 text-xs text-destructive">
                                    No se pudo cargar el audio
                                </div>
                            )}
                        </Label>
                        <button
                            type="button"
                            onClick={() => handlePlay(option.id)}
                            aria-label={`${playingId === option.id ? 'Pausar' : 'Reproducir'} ${option.name}`}
                            className="shrink-0 rounded-md border border-border px-2 py-1 text-sm hover:bg-muted"
                        >
                            {playingId === option.id ? '⏸' : '▶'}
                        </button>
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
