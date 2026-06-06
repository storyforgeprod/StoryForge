import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { GenerateScriptState, StoryStyle } from '../../types';

export type ScriptStageProps = {
    state: GenerateScriptState;
    isPresetMode: boolean;
    isDeveloper: boolean;
    imagesIdle: boolean;
    scriptJobId: string | null;
    style: StoryStyle | null;
    onGenerateImages: () => void;
    onRetry: () => void;
    onOpenImagesPreset: () => void;
};

export const ScriptStage = ({
    state,
    isPresetMode,
    isDeveloper,
    imagesIdle,
    scriptJobId,
    style,
    onGenerateImages,
    onRetry,
    onOpenImagesPreset,
}: ScriptStageProps) => {
    if (isPresetMode) return null;

    const isGenerating = state.phase === 'submitting' || state.phase === 'polling';

    if (isGenerating) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center gap-4 py-16">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Analizando tu historia…</p>
                </CardContent>
            </Card>
        );
    }

    if (state.phase === 'error' && imagesIdle) {
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

    if (state.phase === 'completed' && imagesIdle) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-head text-2xl tracking-[-0.03em]">Guión generado</CardTitle>
                    <CardDescription>
                        Revisá el guión y generá las imágenes para tu historia.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-elev p-4 text-sm leading-relaxed">
                        {state.script}
                    </pre>
                    <div className="flex justify-end gap-2">
                        {isDeveloper && (
                            <Button type="button" variant="outline" onClick={onOpenImagesPreset}>
                                Usar preset
                            </Button>
                        )}
                        <Button
                            type="button"
                            disabled={!scriptJobId || !style}
                            onClick={onGenerateImages}
                        >
                            Generar imágenes
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return null;
};
