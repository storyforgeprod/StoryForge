import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';

const MIN_DURATION = 30;
const MAX_DURATION = 120;

export type DurationSelectorProps = {
  targetDuration: number;
  onDurationChange: (duration: number) => void;
};

export function DurationSelector({ targetDuration, onDurationChange }: DurationSelectorProps) {
  
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
    </div>
  );
}
