import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StoryStyle } from '../types';

type StepStatus = 'pending' | 'active' | 'done' | 'error';

type Phase = string;

const isActivePhase = (phase: Phase) =>
  phase === 'submitting' || phase === 'polling';

export type CreateStepsNavProps = {
  storyValid: boolean;
  style: StoryStyle | null;
  voiceId: string | null;
  scriptPhase: Phase;
  imagesPhase: Phase;
  audioPhase: Phase;
  videoPhase: Phase;
};

export const CreateStepsNav = ({
  storyValid,
  style,
  voiceId,
  scriptPhase,
  imagesPhase,
  audioPhase,
  videoPhase,
}: CreateStepsNavProps) => {
  const collecting = scriptPhase === 'idle';
  const downstreamActive =
    isActivePhase(imagesPhase) || isActivePhase(audioPhase) || isActivePhase(videoPhase);

  const storyStatus: StepStatus = storyValid ? 'done' : collecting ? 'active' : 'pending';
  const styleStatus: StepStatus = style
    ? 'done'
    : storyValid && collecting
      ? 'active'
      : 'pending';
  const scriptStatus: StepStatus =
    scriptPhase === 'completed'
      ? 'done'
      : isActivePhase(scriptPhase)
        ? 'active'
        : scriptPhase === 'error'
          ? 'error'
          : 'pending';
  const voiceStatus: StepStatus = voiceId
    ? 'done'
    : scriptPhase === 'completed' && imagesPhase === 'idle'
      ? 'active'
      : 'pending';
  const videoStatus: StepStatus =
    videoPhase === 'completed'
      ? 'done'
      : downstreamActive
        ? 'active'
        : 'pending';

  const steps: { num: string; label: string; status: StepStatus }[] = [
    { num: '01', label: 'Story', status: storyStatus },
    { num: '02', label: 'Style', status: styleStatus },
    { num: '03', label: 'Script', status: scriptStatus },
    { num: '04', label: 'Voice', status: voiceStatus },
    { num: '05', label: 'Video', status: videoStatus },
  ];

  return (
    <div className="ml-3.5 mt-1 flex flex-col gap-px border-l-2 border-bd2 py-1 pl-3.5">
      {steps.map((step) => (
        <div
          key={step.num}
          aria-current={step.status === 'active' ? 'step' : undefined}
          className={cn(
            'flex items-center gap-2.5 rounded-sm px-2.5 py-[7px] font-mono text-[11px] font-medium uppercase tracking-[0.04em]',
            step.status === 'active' && 'text-primary',
            step.status === 'done' && 'text-muted-foreground',
            step.status === 'error' && 'text-destructive',
            step.status === 'pending' && 'text-mut2',
          )}
        >
          <span className="w-5">{step.status === 'done' ? <Check className="h-3 w-3" /> : step.num}</span>
          {step.label}
        </div>
      ))}
    </div>
  );
};
