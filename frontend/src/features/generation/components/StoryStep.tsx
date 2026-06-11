import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StoryInput } from './StoryInput';
import { validateStory } from '../utils/validation';

const TONES = [
  { value: 'playful',     label: 'Playful' },
  { value: 'dramatic',    label: 'Dramatic' },
  { value: 'suspenseful', label: 'Suspenseful' },
  { value: 'energetic',   label: 'Energetic' },
];

const LENGTHS = [
  { value: 30, label: '30s' },
  { value: 60, label: '60s' },
  { value: 90, label: '90s' },
];

const SCENES = [
  { value: 4,  label: '4 scenes' },
  { value: 5,  label: '5 scenes' },
  { value: 6,  label: '6 scenes' },
  { value: 7,  label: '7 scenes' },
  { value: 8,  label: '8 scenes' },
  { value: 10, label: '10 scenes' },
  { value: 12, label: '12 scenes' },
];

const EXAMPLES = [
  'A cat who secretly runs a black market for belly rub tokens...',
  '3 deep-sea creatures discover they\'re actually roommates...',
  'The day the office plant gained sentience and filed HR complaints...',
];

export type StoryStepProps = {
  story: string;
  onStoryChange: (v: string) => void;
  tone: string;
  onToneChange: (v: string) => void;
  targetDuration: number;
  onDurationChange: (v: number) => void;
  sceneCount: number;
  onSceneCountChange: (v: number) => void;
  onGenerate: () => void;
  isGenerating: boolean;
};

export const StoryStep = ({
  story,
  onStoryChange,
  tone,
  onToneChange,
  targetDuration,
  onDurationChange,
  sceneCount,
  onSceneCountChange,
  onGenerate,
  isGenerating,
}: StoryStepProps) => {
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const { valid } = validateStory(story);

  const handleGenerate = () => {
    setSubmitAttempted(true);
    if (!valid) return;
    onGenerate();
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-2 font-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-acc">
          <Sparkles className="h-3.5 w-3.5" />
          AI script studio
        </div>
        <h1 className="font-head text-[34px] font-extrabold leading-[1.05] tracking-[-0.04em]">
          Turn any story into a viral short
        </h1>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
          YOUR STORY
        </p>
        <StoryInput
          value={story}
          onChange={onStoryChange}
          showErrors={submitAttempted}
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <Select value={tone} onValueChange={onToneChange}>
              <SelectTrigger className="h-8 w-auto gap-1 rounded-full border-border bg-elev px-3 text-[13px]">
                <span className="text-muted-foreground">Tone:&nbsp;</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(targetDuration)}
              onValueChange={(v) => onDurationChange(Number(v))}
            >
              <SelectTrigger className="h-8 w-auto gap-1 rounded-full border-border bg-elev px-3 text-[13px]">
                <span className="text-muted-foreground">Length:&nbsp;</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LENGTHS.map((l) => (
                  <SelectItem key={l.value} value={String(l.value)}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(sceneCount)}
              onValueChange={(v) => onSceneCountChange(Number(v))}
            >
              <SelectTrigger className="h-8 w-auto gap-1 rounded-full border-border bg-elev px-3 text-[13px]">
                <span className="text-muted-foreground">Scenes:&nbsp;</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCENES.map((s) => (
                  <SelectItem key={s.value} value={String(s.value)}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGenerate} disabled={isGenerating || !valid}>
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Generate script
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-[13px] text-muted-foreground">Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            aria-label={ex}
            onClick={() => onStoryChange(ex)}
            className="rounded-full border border-border bg-elev px-4 py-1.5 text-[13px] text-foreground transition hover:bg-elev2"
          >
            {ex.slice(0, 32)}…
          </button>
        ))}
      </div>
    </div>
  );
};
