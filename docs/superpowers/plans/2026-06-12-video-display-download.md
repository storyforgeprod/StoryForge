# Video Display & Download Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the generated video inside the phone mockup on the VideoStep screen and fix the download button so it saves the file instead of redirecting.

**Architecture:** Two isolated changes to a single component. The phone mockup gains a conditional `<video>` element when done; the download `<a>` is replaced by a `<Button>` that fetches the video as a blob and triggers a programmatic download.

**Tech Stack:** React 18, TypeScript (strict), Vitest + Testing Library, Tailwind + shadcn/ui

---

## Files

| Action | Path |
|--------|------|
| Modify | `frontend/src/features/generation/components/VideoStep.tsx` |
| Modify | `frontend/src/features/generation/components/VideoStep.test.tsx` |

---

### Task 1: Update tests for the new behavior

**Files:**
- Modify: `frontend/src/features/generation/components/VideoStep.test.tsx`

- [ ] **Step 1: Replace the broken download-link test and add two new ones**

Open `frontend/src/features/generation/components/VideoStep.test.tsx` and replace the entire file with:

```tsx
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
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'a') return mockAnchor as unknown as HTMLElement;
    return document.createElement(tag);
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
```

- [ ] **Step 2: Run the tests — expect failures on the new cases**

```bash
cd frontend && npm test -- VideoStep
```

Expected: the two new tests (`shows a video element`, `calls fetch`) fail. The existing three pass. This confirms the tests are wired correctly before we touch the implementation.

- [ ] **Step 3: Commit the updated tests**

```bash
git add frontend/src/features/generation/components/VideoStep.test.tsx
git commit -m "test(VideoStep): add tests for video mockup display and blob download"
```

---

### Task 2: Implement video in phone mockup and fetch+blob download

**Files:**
- Modify: `frontend/src/features/generation/components/VideoStep.tsx`

- [ ] **Step 1: Replace the file with the updated implementation**

Open `frontend/src/features/generation/components/VideoStep.tsx` and replace entirely with:

```tsx
import { useState } from 'react';
import { Loader2, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GenerateAudioState, GenerateVideoState } from '../types';

export type VideoStepProps = {
  artStyleLabel: string;
  voiceName: string;
  sceneCount: number;
  targetDuration: number;
  firstImageUrl: string | undefined;
  audioState: GenerateAudioState;
  videoState: GenerateVideoState;
  onRetryAudio: () => void;
  onRetryVideo: () => void;
  onReset: () => void;
};

type PipelinePhase = 'audio' | 'video' | 'done' | 'error-audio' | 'error-video';

function getPhase(audio: GenerateAudioState, video: GenerateVideoState): PipelinePhase {
  if (audio.phase === 'error') return 'error-audio';
  if (video.phase === 'error') return 'error-video';
  if (video.phase === 'completed') return 'done';
  if (audio.phase === 'completed') return 'video';
  return 'audio';
}

export const VideoStep = ({
  artStyleLabel, voiceName, sceneCount, targetDuration,
  firstImageUrl, audioState, videoState, onRetryAudio, onRetryVideo, onReset,
}: VideoStepProps) => {
  const phase = getPhase(audioState, videoState);
  const isGenerating = phase === 'audio' || phase === 'video';
  const videoUrl = videoState.phase === 'completed' ? videoState.videoUrl : undefined;

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!videoUrl) return;
    setDownloading(true);
    try {
      const res = await fetch(videoUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'storyforge-video.mp4';
      a.click();
      URL.revokeObjectURL(blobUrl);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-head text-[32px] font-extrabold tracking-[-0.04em]">Render your video</h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">
          Review your choices, then generate the final vertical video.
        </p>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {/* Summary card */}
        <div className="flex-1 divide-y divide-border rounded-2xl border border-border bg-card">
          {[
            { label: 'ART STYLE', value: artStyleLabel },
            { label: 'VOICE',     value: voiceName },
            { label: 'SCENES',    value: `${sceneCount} · ~${targetDuration}s` },
            { label: 'FORMAT',    value: '9:16 · 1080×1920' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-3 px-5 py-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground w-20 shrink-0">{label}</span>
              <span className="text-[15px] font-bold text-foreground">{value}</span>
            </div>
          ))}
        </div>

        {/* Phone mockup */}
        <div className="mx-auto flex w-[160px] shrink-0 flex-col items-center">
          <div className="relative w-full overflow-hidden rounded-[24px] border-4 border-foreground/20 bg-elev shadow-2xl" style={{ aspectRatio: '9/16' }}>
            {phase === 'done' && videoUrl ? (
              <video
                src={videoUrl}
                poster={firstImageUrl}
                controls
                className="h-full w-full object-cover"
              />
            ) : firstImageUrl ? (
              <img src={firstImageUrl} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-elev2" />
            )}
            {isGenerating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <span className="text-[11px] font-semibold text-white/80">
                  {phase === 'audio' ? 'Generating audio…' : 'Generating video…'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error states */}
      {phase === 'error-audio' && (
        <div className="flex items-center justify-between rounded-xl border border-destructive/40 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{(audioState as { message: string }).message}</p>
          <Button variant="outline" size="sm" onClick={onRetryAudio}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry audio
          </Button>
        </div>
      )}

      {phase === 'error-video' && (
        <div className="flex items-center justify-between rounded-xl border border-destructive/40 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{(videoState as { message: string }).message}</p>
          <Button variant="outline" size="sm" onClick={onRetryVideo}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry video
          </Button>
        </div>
      )}

      {/* Done state */}
      {phase === 'done' && videoUrl && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-acc-soft p-5">
          <p className="text-[15px] font-semibold text-foreground">Your video is ready!</p>
          <div className="flex gap-2">
            <Button onClick={handleDownload} disabled={downloading} aria-label="Download video">
              {downloading ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-1.5 h-4 w-4" />
              )}
              {downloading ? 'Downloading…' : 'Download'}
            </Button>
            <Button variant="outline" onClick={onReset}>Start over</Button>
          </div>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Run the tests — expect all to pass**

```bash
cd frontend && npm test -- VideoStep
```

Expected output: 5 tests pass, 0 fail.

- [ ] **Step 3: Run the full test suite to check for regressions**

```bash
cd frontend && npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit the implementation**

```bash
git add frontend/src/features/generation/components/VideoStep.tsx
git commit -m "feat(VideoStep): show video in phone mockup and fix download via fetch+blob"
```
