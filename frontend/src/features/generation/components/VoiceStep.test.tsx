import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VoiceStep } from './VoiceStep';

it('renders 6 voice options', () => {
  render(<VoiceStep value={null} onChange={vi.fn()} onContinue={vi.fn()} />);
  expect(screen.getByText('Alloy')).toBeInTheDocument();
  expect(screen.getByText('Echo')).toBeInTheDocument();
  expect(screen.getByText('Fable')).toBeInTheDocument();
  expect(screen.getByText('Onyx')).toBeInTheDocument();
  expect(screen.getByText('Nova')).toBeInTheDocument();
  expect(screen.getByText('Shimmer')).toBeInTheDocument();
});

it('enables Continue button after selection', () => {
  render(<VoiceStep value="echo" onChange={vi.fn()} onContinue={vi.fn()} />);
  expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled();
});

it('disables Continue button when no voice is selected', () => {
  render(<VoiceStep value={null} onChange={vi.fn()} onContinue={vi.fn()} />);
  expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
});

it('calls onChange when a voice is selected', () => {
  const onChange = vi.fn();
  render(<VoiceStep value={null} onChange={onChange} onContinue={vi.fn()} />);
  fireEvent.click(screen.getByLabelText('Alloy'));
  expect(onChange).toHaveBeenCalledWith('alloy');
});
