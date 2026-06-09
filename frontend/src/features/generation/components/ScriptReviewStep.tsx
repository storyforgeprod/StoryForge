import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GenerateScriptState } from '../types';

type ParsedScene = {
    index: number;
    narration: string;
    onScreen: string;
    duration: number;
};

function parseScenes(script: string): ParsedScene[] {
    const scenes: ParsedScene[] = [];

    // Split at each "Scene N:" boundary, keeping the marker with its block
    const blocks = script.split(/(?=^Scene\s+\d+:)/mi);

    for (const block of blocks) {
        const trimmed = block.trim();
        if (!trimmed) continue;

        const headerMatch = trimmed.match(/^Scene\s+(\d+):\s*(.+?)(?:\s*\((\d+)s\))?$/im);
        if (!headerMatch) continue;

        const index = parseInt(headerMatch[1], 10);
        const rawDesc = headerMatch[2].trim();
        const narration = rawDesc.replace(/^\[|\]$/g, '').trim();
        const duration = headerMatch[3] ? parseInt(headerMatch[3], 10) : 0;

        const soundMatch = trimmed.match(/\[Sound:\s*(.+?)\]/i);
        const onScreen = soundMatch ? soundMatch[1].trim() : '';

        scenes.push({ index, narration, onScreen, duration });
    }

    // Fallback: split by double newlines
    if (scenes.length === 0) {
        const paragraphs = script.split(/\n{2,}/).filter((p) => p.trim());
        return paragraphs.slice(0, 12).map((p, i) => ({
            index: i + 1,
            narration: p.trim().split('\n')[0].slice(0, 200),
            onScreen: '',
            duration: 0,
        }));
    }

    return scenes;
}

export type ScriptReviewStepProps = {
    state: GenerateScriptState;
    onRegenerate: () => void;
};

export const ScriptReviewStep = ({ state, onRegenerate }: ScriptReviewStepProps) => {
    if (state.phase === 'submitting' || state.phase === 'polling') {
        return (
            <div className="flex flex-col items-center gap-4 py-16">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Generando tu guión…</p>
            </div>
        );
    }

    if (state.phase === 'error') {
        return (
            <div className="flex flex-col items-center gap-4 py-12">
                <p className="text-sm text-destructive">{state.message}</p>
                <Button type="button" variant="outline" onClick={onRegenerate}>
                    Reintentar
                </Button>
            </div>
        );
    }

    if (state.phase === 'completed') {
        const scenes = parseScenes(state.script);
        const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <p className="text-xs text-muted-foreground">
                        {scenes.length} escena{scenes.length !== 1 ? 's' : ''}
                        {totalDuration > 0 ? ` · ~${totalDuration}s` : ''}
                        {' · tocá cualquier línea para editar'}
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 gap-1.5"
                        onClick={onRegenerate}
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Regenerar todo
                    </Button>
                </div>

                <div className="space-y-2">
                    {scenes.map((scene) => (
                        <div
                            key={scene.index}
                            className="flex gap-3.5 rounded-xl bg-elev p-3.5 transition-colors hover:bg-elev2"
                        >
                            <div className="relative flex h-[76px] w-[64px] shrink-0 items-end rounded-lg bg-elev2 p-1.5">
                                <span className="rounded px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none bg-acc text-on-acc">
                                    {String(scene.index).padStart(2, '0')}
                                </span>
                            </div>

                            <div className="min-w-0 flex-1 space-y-1 py-1">
                                <p className="line-clamp-3 text-sm font-medium leading-snug text-foreground">
                                    {scene.narration}
                                </p>
                                {scene.onScreen && (
                                    <p className="line-clamp-1 text-xs text-muted-foreground">
                                        on-screen: &ldquo;{scene.onScreen}&rdquo;
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return null;
};
