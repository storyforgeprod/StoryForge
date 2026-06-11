import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { CreateStepsNav } from '../components/CreateStepsNav';
import { GenerationFlow } from '../components/GenerationFlow';
import type { WizardStep } from '../types';

const CRUMBS: Record<WizardStep, string> = {
  story:  'Create / Story',
  script: 'Create / Script',
  style:  'Create / Style',
  voice:  'Create / Voice',
  video:  'Create / Video',
};

export function GeneratePage() {
  const [currentStep, setCurrentStep] = useState<WizardStep>('story');

  return (
    <AppShell
      crumb={CRUMBS[currentStep]}
      steps={<CreateStepsNav currentStep={currentStep} />}
    >
      <GenerationFlow onStepChange={setCurrentStep} />
    </AppShell>
  );
}
