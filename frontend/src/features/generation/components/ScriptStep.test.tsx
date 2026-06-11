import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ScriptStep } from './ScriptStep';
import type { GenerateScriptState } from '../types';

const completedState: GenerateScriptState = {
  phase: 'completed',
  script: `Scene 1: The cat stares. (3s)\n[Sound: Meow]\n\nScene 2: Plot twist. (3s)\n[Sound: Gasp]`,
};

it('renders scene cards when completed', () => {
  render(<ScriptStep state={completedState} onRegenerate={vi.fn()} onContinue={vi.fn()} />);
  expect(screen.getByText(/the cat stares/i)).toBeInTheDocument();
  expect(screen.getByText(/plot twist/i)).toBeInTheDocument();
});

it('enables Continue button only when completed', () => {
  const loadingState: GenerateScriptState = { phase: 'polling', jobId: 'j1', attempts: 0 };
  render(<ScriptStep state={loadingState} onRegenerate={vi.fn()} onContinue={vi.fn()} />);
  expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
});

it('calls onContinue when Continue is clicked', () => {
  const onContinue = vi.fn();
  render(<ScriptStep state={completedState} onRegenerate={vi.fn()} onContinue={onContinue} />);
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  expect(onContinue).toHaveBeenCalledOnce();
});
