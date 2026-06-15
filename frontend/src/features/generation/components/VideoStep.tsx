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
      if (!res.ok) throw new Error(`Download failed: ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'storyforge-video.mp4';
      a.click();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
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
                playsInline
                controlsList="nodownload"
                aria-label="Vista previa del video generado"
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
