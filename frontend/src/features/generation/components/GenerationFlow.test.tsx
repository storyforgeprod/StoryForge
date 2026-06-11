import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GenerationFlow } from './GenerationFlow';

vi.mock('../hooks/useGenerateScript', () => ({ useGenerateScript: () => ({ state: { phase: 'idle' }, generate: vi.fn(), reset: vi.fn() }) }));
vi.mock('../hooks/useGenerateImages', () => ({ useGenerateImages: () => ({ state: { phase: 'idle' }, generate: vi.fn(), reset: vi.fn() }) }));
vi.mock('../hooks/useGenerateAudio',  () => ({ useGenerateAudio:  () => ({ state: { phase: 'idle' }, generate: vi.fn(), reset: vi.fn() }) }));
vi.mock('../hooks/useGenerateVideo',  () => ({ useGenerateVideo:  () => ({ state: { phase: 'idle' }, generate: vi.fn(), reset: vi.fn() }) }));

it('renders StoryStep on initial load', () => {
  render(<GenerationFlow onStepChange={vi.fn()} />);
  expect(screen.getByText(/turn any story into/i)).toBeInTheDocument();
});
