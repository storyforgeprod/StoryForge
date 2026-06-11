import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseScenes } from '../utils/parseScript';
import type { GenerateScriptState } from '../types';

export type ScriptStepProps = {
  state: GenerateScriptState;
  onRegenerate: () => void;
  onContinue: () => void;
};

export const ScriptStep = ({ state, onRegenerate, onContinue }: ScriptStepProps) => {
  const isLoading = state.phase === 'submitting' || state.phase === 'polling';
  const isCompleted = state.phase === 'completed';

  const scenes = isCompleted ? parseScenes(state.script) : [];
  const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-head text-[32px] font-extrabold tracking-[-0.04em]">Your script</h1>
          {isCompleted && (
            <p className="mt-1 text-[14px] text-muted-foreground">
              {scenes.length} scenes{totalDuration > 0 ? ` · ~${totalDuration}s` : ''}
            </p>
          )}
        </div>
        {isCompleted && (
          <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={onRegenerate}>
            <RefreshCw className="h-3.5 w-3.5" />
            Regenerate all
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex flex-col items-center gap-4 py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Generating your script…</p>
        </div>
      )}

      {state.phase === 'error' && (
        <div className="flex flex-col items-center gap-4 py-16">
          <p className="text-sm text-destructive">{state.message}</p>
          <Button variant="outline" onClick={onRegenerate}>Retry</Button>
        </div>
      )}

      {isCompleted && (
        <div className="space-y-2">
          {scenes.map((scene) => (
            <div
              key={scene.index}
              className="flex gap-3.5 rounded-xl bg-elev p-3.5"
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
      )}

      <div className="flex justify-end">
        <Button disabled={!isCompleted} onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
};
