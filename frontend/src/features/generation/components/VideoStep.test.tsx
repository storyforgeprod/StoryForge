import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VideoStep } from './VideoStep';

const doneProps = {
  artStyleLabel: 'Bold Comic',
  voiceName: 'Atlas',
  sceneCount: 5,
  targetDuration: 30,
  firstImageUrl: 'https://example.com/preview.jpg',
  audioState: { phase: 'completed' as const, audioUrl: '/audio.mp3', audioLength: 30 },
  videoState: { phase: 'completed' as const, videoUrl: 'https://example.com/video.mp4', duration: 30, fileSize: 1_000_000 },
  onRetryAudio: vi.fn(),
  onRetryVideo: vi.fn(),
  onReset: vi.fn(),
};

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

it('shows a video element in the phone mockup when done', () => {
  render(<VideoStep {...doneProps} />);
  const video = screen.getByRole('video') as HTMLVideoElement ?? document.querySelector('video');
  // query directly since jsdom doesn't assign implicit role to <video>
  const videoEl = document.querySelector('video');
  expect(videoEl).not.toBeNull();
  expect(videoEl!.src).toContain('video.mp4');
  expect(videoEl!.poster).toContain('preview.jpg');
});

it('shows a download button (not a link) when done', () => {
  render(<VideoStep {...doneProps} />);
  expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /download/i })).toBeNull();
});

it('calls fetch with the video URL when download is clicked', async () => {
  const user = userEvent.setup();

  const mockAnchor = { href: '', download: '', click: vi.fn() };
  const originalCreateElement = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'a') return mockAnchor as unknown as HTMLElement;
    return originalCreateElement(tag);
  });
  global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test-url');
  global.URL.revokeObjectURL = vi.fn();
  global.fetch = vi.fn().mockResolvedValue({
    blob: () => Promise.resolve(new Blob(['video'], { type: 'video/mp4' })),
  }) as unknown as typeof fetch;

  render(<VideoStep {...doneProps} />);
  await user.click(screen.getByRole('button', { name: /download/i }));

  expect(global.fetch).toHaveBeenCalledWith('https://example.com/video.mp4');
  expect(mockAnchor.download).toBe('storyforge-video.mp4');
  expect(mockAnchor.click).toHaveBeenCalled();
  expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');

  vi.restoreAllMocks();
});
