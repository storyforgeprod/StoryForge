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
import { ImageGrid } from '../ImageGrid';
import type { GenerateImagesState } from '../../types';

export type ImagesStageProps = {
    state: GenerateImagesState;
    audioIdle: boolean;
    isDeveloper: boolean;
    onGenerateAudio: () => void;
    onRetry: () => void;
    onOpenAudioPreset: () => void;
};

export const ImagesStage = forwardRef<HTMLDivElement, ImagesStageProps>(
    ({ state, audioIdle, isDeveloper, onGenerateAudio, onRetry, onOpenAudioPreset }, ref) => {
        const isGenerating = state.phase === 'submitting' || state.phase === 'polling';

        if (isGenerating) {
            return (
                <Card ref={ref}>
                    <CardContent className="flex flex-col items-center gap-4 py-16">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Generando imágenes…</p>
                    </CardContent>
                </Card>
            );
        }

        if (state.phase === 'completed' && audioIdle) {
            return (
                <Card ref={ref}>
                    <CardHeader>
                        <CardTitle>Imágenes generadas</CardTitle>
                        <CardDescription>
                            Revisá las imágenes antes de continuar al audio.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ImageGrid imageUrls={state.imageUrls} />
                        <div className="flex justify-end gap-2">
                            {isDeveloper && (
                                <Button type="button" variant="outline" onClick={onOpenAudioPreset}>
                                    Usar preset
                                </Button>
                            )}
                            <Button type="button" onClick={onGenerateAudio}>
                                Generar narración
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

ImagesStage.displayName = 'ImagesStage';
