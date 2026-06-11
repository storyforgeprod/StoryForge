import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StyleStep } from './StyleStep';
import type { GenerateImagesState } from '../types';

const idleImages: GenerateImagesState = { phase: 'idle' };

it('renders 6 style options', () => {
  render(<StyleStep value={null} onChange={vi.fn()} imagesState={idleImages} sceneCount={5} onContinue={vi.fn()} />);
  expect(screen.getByLabelText('Bold Comic')).toBeInTheDocument();
  expect(screen.getByLabelText('3D Toon')).toBeInTheDocument();
});

it('calls onChange when a style is selected', () => {
  const onChange = vi.fn();
  render(<StyleStep value={null} onChange={onChange} imagesState={idleImages} sceneCount={5} onContinue={vi.fn()} />);
  fireEvent.click(screen.getByLabelText('Manga Ink'));
  expect(onChange).toHaveBeenCalledWith('manga-ink');
});

it('enables Continue button when a style is selected', () => {
  render(<StyleStep value="bold-comic" onChange={vi.fn()} imagesState={idleImages} sceneCount={5} onContinue={vi.fn()} />);
  expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled();
});

it('shows ScenePreviewRow when a style is selected', () => {
  render(<StyleStep value="bold-comic" onChange={vi.fn()} imagesState={idleImages} sceneCount={3} onContinue={vi.fn()} />);
  expect(screen.getAllByTestId('scene-skeleton')).toHaveLength(3);
});
