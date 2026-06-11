import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WizardStep } from '../types';

export type CreateStepsNavProps = {
  currentStep: WizardStep;
};

const STEPS: { id: WizardStep; num: string; label: string }[] = [
  { id: 'story',  num: '01', label: 'Story' },
  { id: 'script', num: '02', label: 'Script' },
  { id: 'style',  num: '03', label: 'Style' },
  { id: 'voice',  num: '04', label: 'Voice' },
  { id: 'video',  num: '05', label: 'Video' },
];

const STEP_ORDER: WizardStep[] = ['story', 'script', 'style', 'voice', 'video'];

export const CreateStepsNav = ({ currentStep }: CreateStepsNavProps) => {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <ol className="ml-3.5 mt-1 flex flex-col gap-px border-l-2 border-bd2 py-1 pl-3.5">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isActive = step.id === currentStep;
        return (
          <li
            key={step.id}
            aria-current={isActive ? 'step' : undefined}
            className={cn(
              'flex items-center gap-2.5 rounded-sm px-2.5 py-[7px] font-mono text-[11px] font-medium uppercase tracking-[0.04em]',
              isActive && 'text-primary',
              isDone && 'text-muted-foreground',
              !isActive && !isDone && 'text-mut2',
            )}
          >
            <span className="w-5">
              {isDone ? <Check className="h-3 w-3" /> : step.num}
            </span>
            {step.label}
          </li>
        );
      })}
    </ol>
  );
};
