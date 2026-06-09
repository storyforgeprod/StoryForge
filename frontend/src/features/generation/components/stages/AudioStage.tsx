import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { AudioPlayer } from '../AudioPlayer';
import type { GenerateAudioState, GenerateVideoState } from '../../types';

export type AudioStageProps = {
    state: GenerateAudioState;
    videoState: GenerateVideoState;
    isDeveloper: boolean;
    imageJobId: string | null;
    audioJobId: string | null;
    onGenerateVideo: () => void;
    onRetry: () => void;
    onOpenVideoPreset: () => void;
};

export const AudioStage = forwardRef<HTMLDivElement, AudioStageProps>(
    (
        {
            state,
            videoState,
            isDeveloper,
            imageJobId,
            audioJobId,
            onGenerateVideo,
            onRetry,
            onOpenVideoPreset,
        },
        ref,
    ) => {
        const isGeneratingAudio = state.phase === 'submitting' || state.phase === 'polling';
        const isGeneratingVideo =
            videoState.phase === 'submitting' || videoState.phase === 'polling';

        if (isGeneratingAudio) {
            return (
                <Card ref={ref}>
                    <CardContent className="flex flex-col items-center gap-4 py-16">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Generando narración…</p>
                    </CardContent>
                </Card>
            );
        }

        if (
            state.phase === 'completed' &&
            videoState.phase === 'idle' &&
            !isGeneratingVideo
        ) {
            return (
                <Card ref={ref}>
                    <CardHeader>
                        <CardTitle className="font-head text-2xl tracking-[-0.03em]">Narración generada</CardTitle>
                        <CardDescription>
                            Escuchá la narración y generá el video final.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {state.audioUrl && (
                            <AudioPlayer
                                src={state.audioUrl}
                                durationSeconds={state.audioLength}
                            />
                        )}
                        <p className="text-sm text-muted-foreground">
                            Puede tardar hasta 3 minutos.
                        </p>
                        <div className="flex justify-end gap-2">
                            {isDeveloper && (
                                <Button type="button" variant="outline" onClick={onOpenVideoPreset}>
                                    Usar preset
                                </Button>
                            )}
                            <Button
                                type="button"
                                disabled={!imageJobId || !audioJobId}
                                onClick={onGenerateVideo}
                            >
                                Generar video
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        if (state.phase === 'error') {
            return (
                <Card>
                    <CardContent className="flex flex-col items-center gap-4 py-16">
                        <p className="text-sm text-destructive">{state.message}</p>
                        <Button type="button" variant="outline" onClick={onRetry}>
                            Reintentar
                        </Button>
                    </CardContent>
                </Card>
            );
        }

        return null;
    },
);

AudioStage.displayName = 'AudioStage';
