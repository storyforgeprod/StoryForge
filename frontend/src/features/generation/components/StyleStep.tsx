import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { StyleThumb } from './StyleThumb';
import { ScenePreviewRow } from './ScenePreviewRow';
import type { StoryStyle, GenerateImagesState } from '../types';

type StyleOption = { value: StoryStyle; label: string; description: string };

const STYLE_OPTIONS: StyleOption[] = [
  { value: 'bold-comic',   label: 'Bold Comic',   description: 'bold comic · illustrated' },
  { value: 'soft-cartoon', label: 'Soft Cartoon',  description: 'soft cartoon · illustrated' },
  { value: 'retro-pop',    label: 'Retro Pop',     description: 'retro pop · illustrated' },
  { value: 'manga-ink',    label: 'Manga Ink',     description: 'manga ink · illustrated' },
  { value: 'storybook',    label: 'Storybook',     description: 'storybook · illustrated' },
  { value: '3d-toon',      label: '3D Toon',       description: '3d toon · illustrated' },
];

export type StyleStepProps = {
  value: StoryStyle | null;
  onChange: (style: StoryStyle) => void;
  imagesState: GenerateImagesState;
  sceneCount: number;
  onContinue: () => void;
};

export const StyleStep = ({ value, onChange, imagesState, sceneCount, onContinue }: StyleStepProps) => {
  const imageUrls = imagesState.phase === 'completed' ? imagesState.imageUrls : [];
  const hasError = imagesState.phase === 'error';
  const isGeneratingImages = imagesState.phase === 'submitting' || imagesState.phase === 'polling';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-head text-[32px] font-extrabold tracking-[-0.04em]">Pick your art style</h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">Every scene will be illustrated in this look.</p>
      </div>

      <RadioGroup
        value={value ?? undefined}
        onValueChange={(v) => onChange(v as StoryStyle)}
        aria-label="Select art style"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        {STYLE_OPTIONS.map((option) => {
          const id = `style-${option.value}`;
          const checked = value === option.value;
          return (
            <div key={option.value} className="relative">
              <RadioGroupItem id={id} value={option.value} aria-label={option.label} className="peer sr-only" />
              <Label
                htmlFor={id}
                className={cn(
                  'block cursor-pointer overflow-hidden rounded-xl border bg-card transition-all',
                  'hover:-translate-y-0.5 hover:border-bd2',
                  checked ? 'border-primary shadow-[0_0_0_1px_var(--primary)]' : 'border-border',
                )}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <StyleThumb style={option.value} className="h-full w-full object-cover" />
                  <span className={cn(
                    'absolute right-2 top-2 grid h-[22px] w-[22px] place-items-center rounded-full bg-primary text-on-acc transition-all',
                    checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
                  )}>
                    <Check className="h-3 w-3" />
                  </span>
                </div>
                <div className="px-3 py-2.5">
                  <div className="text-[13.5px] font-bold text-foreground">{option.label}</div>
                  <div className="mt-0.5 text-[11.5px] text-mut2">{option.description}</div>
                </div>
              </Label>
            </div>
          );
        })}
      </RadioGroup>

      {value && (
        <div>
          <p className="mb-3 text-[14px] font-semibold text-foreground">
            Your scenes in <span className="text-primary">{STYLE_OPTIONS.find((o) => o.value === value)?.label}</span>
          </p>
          <p className="mb-3 text-[12px] text-muted-foreground">
            {sceneCount} scenes illustrated in this style — scroll to preview all
          </p>
          <ScenePreviewRow sceneCount={sceneCount} imageUrls={imageUrls} />
          {hasError && (
            <p className="mt-2 text-xs text-destructive">
              Image generation failed. You can still continue — images will be skipped.
            </p>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <Button disabled={!value || isGeneratingImages} onClick={onContinue}>
          {isGeneratingImages ? 'Generating images…' : 'Continue'}
        </Button>
      </div>
    </div>
  );
};
