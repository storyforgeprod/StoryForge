import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';

const MIN_DURATION = 30;
const MAX_DURATION = 120;
const MAX_SCENES = 12;
const AVG_SECONDS_PER_SCENE = 5; // Default scene duration

export type DurationSelectorProps = {
  targetDuration: number;
  onDurationChange: (duration: number) => void;
};

export function DurationSelector({ targetDuration, onDurationChange }: DurationSelectorProps) {
  const estimatedScenes = useMemo(() => {
    return Math.ceil(targetDuration / AVG_SECONDS_PER_SCENE);
  }, [targetDuration]);

  const isOptimal = estimatedScenes <= MAX_SCENES;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-semibold block mb-2">
          Duración esperada del video
        </label>
        <div className="flex items-center gap-4">
          <Slider
            value={[targetDuration]}
            onValueChange={(value) => onDurationChange(value[0])}
            min={MIN_DURATION}
            max={MAX_DURATION}
            step={5}
            className="flex-1"
          />
          <div className="text-right w-20">
            <div className="text-2xl font-bold text-primary">{targetDuration}s</div>
            <div className="text-xs text-muted-foreground">segundos</div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-2 flex justify-between">
          <span>{MIN_DURATION}s</span>
          <span>{MAX_DURATION}s</span>
        </div>
      </div>

      <Card className={!isOptimal ? 'border-amber-500' : ''}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            Estimación de escenas
            <Badge variant={isOptimal ? 'default' : 'destructive'}>
              {estimatedScenes}/{MAX_SCENES}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm text-muted-foreground">
            A una duración promedio de <span className="font-semibold">{AVG_SECONDS_PER_SCENE}s por escena</span>,
            se generarían aproximadamente <span className="font-semibold">{estimatedScenes}</span> escenas.
          </div>
          
          {!isOptimal && (
            <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950 p-2 rounded">
              ⚠️ Reduci la duración para disminuir el número de escenas. El máximo es {MAX_SCENES} escenas.
            </div>
          )}

          <div className="text-xs text-muted-foreground mt-3 pt-3 border-t space-y-1">
            <div className="flex justify-between">
              <span>Duración total del video:</span>
              <span className="font-semibold">{targetDuration}s</span>
            </div>
            <div className="flex justify-between">
              <span>Duración de audio:</span>
              <span className="font-semibold">~{targetDuration}s (narración ajustada)</span>
            </div>
            <div className="flex justify-between">
              <span>Duración escenas:</span>
              <span className="font-semibold">~{estimatedScenes * AVG_SECONDS_PER_SCENE}s</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
