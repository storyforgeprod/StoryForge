import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StoryStep } from './StoryStep';

const base = {
  story: '',
  onStoryChange: vi.fn(),
  tone: 'playful',
  onToneChange: vi.fn(),
  targetDuration: 30,
  onDurationChange: vi.fn(),
  sceneCount: 5,
  onSceneCountChange: vi.fn(),
  onGenerate: vi.fn(),
  isGenerating: false,
};

it('renders textarea and Generate button', () => {
  render(<StoryStep {...base} />);
  expect(screen.getByRole('textbox')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /generate script/i })).toBeInTheDocument();
});

it('calls onGenerate when story is valid', () => {
  const onGenerate = vi.fn();
  render(<StoryStep {...base} story={'a'.repeat(60)} onGenerate={onGenerate} />);
  fireEvent.click(screen.getByRole('button', { name: /generate script/i }));
  expect(onGenerate).toHaveBeenCalledOnce();
});

it('does not call onGenerate when story is too short', () => {
  const onGenerate = vi.fn();
  render(<StoryStep {...base} story="short" onGenerate={onGenerate} />);
  fireEvent.click(screen.getByRole('button', { name: /generate script/i }));
  expect(onGenerate).not.toHaveBeenCalled();
});

it('fills textarea when example prompt is clicked', () => {
  const onStoryChange = vi.fn();
  render(<StoryStep {...base} onStoryChange={onStoryChange} />);
  const exampleButtons = screen.getAllByRole('button', { name: /cat|deep-sea|office/i });
  fireEvent.click(exampleButtons[0]);
  expect(onStoryChange).toHaveBeenCalled();
});

it('renders the Scenes select showing the current sceneCount value', () => {
  render(<StoryStep {...base} sceneCount={8} />);
  // Verifies value={String(sceneCount)} binding — the trigger displays the selected value
  expect(screen.getByText('8 scenes')).toBeInTheDocument();
});
