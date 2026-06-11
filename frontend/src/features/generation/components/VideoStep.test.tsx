import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VideoStep } from './VideoStep';
import type { GenerateAudioState, GenerateVideoState } from '../types';

it('shows "Generating audio" when audio is loading', () => {
  render(
    <VideoStep
      artStyleLabel="Bold Comic" voiceName="Atlas" sceneCount={5} targetDuration={30}
      firstImageUrl={undefined}
      audioState={{ phase: 'polling', jobId: 'a1' }}
      videoState={{ phase: 'idle' }}
      onRetryAudio={vi.fn()} onRetryVideo={vi.fn()} onReset={vi.fn()}
    />
  );
  expect(screen.getByText(/generating audio/i)).toBeInTheDocument();
});

it('shows download button when video is completed', () => {
  render(
    <VideoStep
      artStyleLabel="Bold Comic" voiceName="Atlas" sceneCount={5} targetDuration={30}
      firstImageUrl={undefined}
      audioState={{ phase: 'completed', audioUrl: '/audio.mp3', audioLength: 30 }}
      videoState={{ phase: 'completed', videoUrl: '/video.mp4', duration: 30, fileSize: 1000 }}
      onRetryAudio={vi.fn()} onRetryVideo={vi.fn()} onReset={vi.fn()}
    />
  );
  expect(screen.getByRole('link', { name: /download/i })).toBeInTheDocument();
});

it('shows retry audio button on audio error', () => {
  const onRetryAudio = vi.fn();
  render(
    <VideoStep
      artStyleLabel="Bold Comic" voiceName="Atlas" sceneCount={5} targetDuration={30}
      firstImageUrl={undefined}
      audioState={{ phase: 'error', message: 'Failed' }}
      videoState={{ phase: 'idle' }}
      onRetryAudio={onRetryAudio} onRetryVideo={vi.fn()} onReset={vi.fn()}
    />
  );
  expect(screen.getByRole('button', { name: /retry audio/i })).toBeInTheDocument();
});
