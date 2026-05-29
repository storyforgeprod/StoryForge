import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DownloadCard } from '../DownloadCard';
import type { GenerateVideoState } from '../../types';

export type VideoStageProps = {
    state: GenerateVideoState;
    onReset: () => void;
    onRetry: () => void;
};

export const VideoStage = forwardRef<HTMLDivElement, VideoStageProps>(
    ({ state, onReset, onRetry }, ref) => {
        const isGenerating = state.phase === 'submitting' || state.phase === 'polling';

        if (isGenerating) {
            return (
                <Card ref={ref}>
                    <CardContent className="flex flex-col items-center gap-4 py-16">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Ensamblando tu video…</p>
                    </CardContent>
                </Card>
            );
        }

        if (state.phase === 'completed') {
            return (
                <div ref={ref} className="space-y-4">
                    <DownloadCard
                        videoUrl={state.videoUrl}
                        durationSeconds={state.duration}
                        fileSizeBytes={state.fileSize}
                    />
                    <div className="flex justify-center">
                        <Button type="button" variant="outline" onClick={onReset}>
                            Nueva historia
                        </Button>
                    </div>
                </div>
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

VideoStage.displayName = 'VideoStage';
