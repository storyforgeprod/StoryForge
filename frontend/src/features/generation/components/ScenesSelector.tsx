import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';

export interface ScenesSelectorProps {
  targetScenes: number;
  onScenesChange: (scenes: number) => void;
  targetDuration: number; // For calculating duration per scene
}

const MIN_SCENES = 1;
const MAX_SCENES = 12;

export function ScenesSelector({ targetScenes, onScenesChange, targetDuration }: ScenesSelectorProps) {
  const durationPerScene = useMemo(() => {
    return targetDuration / targetScenes;
  }, [targetDuration, targetScenes]);

  const isValidScenes = targetScenes >= MIN_SCENES && targetScenes <= MAX_SCENES;

  return (
    <Card className="w-full border border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Cantidad de Escenas</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Slider for scenes selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              Escenas: <span className="font-bold">{targetScenes}</span>
            </label>
            <Badge variant={isValidScenes ? 'default' : 'destructive'}>
              {MIN_SCENES}-{MAX_SCENES}
            </Badge>
          </div>

          <Slider
            min={MIN_SCENES}
            max={MAX_SCENES}
            step={1}
            value={[targetScenes]}
            onValueChange={(value) => onScenesChange(value[0])}
            className="w-full"
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{MIN_SCENES} escena</span>
            <span>{MAX_SCENES} escenas</span>
          </div>
        </div>

        {/* Duration per scene info */}
        <div className="rounded-lg bg-muted/50 p-4 space-y-2">
          <div className="text-sm font-medium text-foreground">Información de duración</div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div>
              Duración por escena: <span className="font-semibold text-foreground">{durationPerScene.toFixed(1)}s</span>
            </div>
            <div>
              Duración total: <span className="font-semibold text-foreground">{targetDuration}s</span>
            </div>
            <div>
              Cantidad de escenas: <span className="font-semibold text-foreground">{targetScenes}</span>
            </div>
          </div>
        </div>

        {/* Validation info */}
        {!isValidScenes && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
            <div className="text-sm font-medium text-destructive">
              ⚠️ Cantidad de escenas inválida
            </div>
            <div className="text-xs text-destructive/90">
              Selecciona entre {MIN_SCENES} y {MAX_SCENES} escenas.
            </div>
          </div>
        )}

        {/* Scene duration too short warning */}
        {durationPerScene < 2 && (
          <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3">
            <div className="text-sm font-medium text-yellow-700 dark:text-yellow-600">
              ⚠️ Duración por escena muy corta
            </div>
            <div className="text-xs text-yellow-700/90 dark:text-yellow-600/90">
              {durationPerScene.toFixed(1)}s por escena puede ser muy rápido para mostrar contenido visual.
              Considera aumentar la duración del video o reducir la cantidad de escenas.
            </div>
          </div>
        )}

        {/* Scene duration too long info */}
        {durationPerScene > 15 && (
          <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-3">
            <div className="text-sm font-medium text-blue-700 dark:text-blue-600">
              ℹ️ Duración por escena larga
            </div>
            <div className="text-xs text-blue-700/90 dark:text-blue-600/90">
              {durationPerScene.toFixed(1)}s por escena es bastante tiempo. Asegurate de que cada
              escena tenga suficiente contenido visual interesante.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
