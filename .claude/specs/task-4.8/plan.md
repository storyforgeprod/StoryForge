# Technical Plan: MP4 Export and Download UI — Task 4.8

## High-Level Architecture

```
Generate.tsx
  └── wizardPhase === 'video-*'
        ├── [video-idle]     → "Generar video" button
        ├── [video-loading]  → spinner + "Ensamblando tu video…" + PipelineProgress video=active
        ├── [video-done]     → DownloadCard (size, duration, expiry note, download button)
        └── [video-error]    → error + "Reintentar"
```

## Components Affected

| Component | Change Type | Notes |
|-----------|-------------|-------|
| `frontend/src/components/DownloadCard/DownloadCard.tsx` | New | Download CTA with metadata |
| `frontend/src/pages/Generate.tsx` | Modified | Add video wizard phases; wire `useGenerateVideo`; final state |

## Architecture Decision Records

### ADR-1: Native `<a href download>` for the download trigger

- **Context:** The video is a Supabase signed URL. Options: fetch+Blob, or a plain anchor.
- **Decision:** Use `<a href={videoUrl} download="storyforge-video.mp4">`. The signed URL is a direct storage URL that the browser can stream-download.
- **Rationale:** Zero JavaScript needed; works on all browsers; no memory pressure from Blob creation.
- **Trade-offs:** Signed URL must not require custom auth headers (Supabase public signed URLs don't require this).

### ADR-2: `DownloadCard` is a display-only component

- **Context:** The download state needs to show URL, size, duration, and expiry notice.
- **Decision:** `DownloadCard` receives `videoUrl`, `durationSeconds`, `fileSizeBytes` as props and renders them. The download anchor is inside the component.
- **Rationale:** Keeps `Generate.tsx` clean; component is independently testable.
- **Trade-offs:** None.

## Component API

```ts
// frontend/src/components/DownloadCard/DownloadCard.tsx
export type DownloadCardProps = {
  videoUrl: string;
  durationSeconds: number;
  fileSizeBytes: number;
};

// Helpers (inside component or in utils)
function formatFileSize(bytes: number): string  // "12.3 MB"
function formatDuration(seconds: number): string // "45s"
```

## Generate.tsx Final Phase

```ts
// After audio-done → video-idle
// On "Generar video" click → generateVideo(imageJobId, audioJobId)
// On completed → wizardPhase = 'video-done'
//   render: <DownloadCard videoUrl={...} durationSeconds={...} fileSizeBytes={...} />
//           + "Generar otro video" link → resets all state, returns to step 1
```

## Security Considerations

- Signed URL is delivered as-is from Supabase; 24h expiry limits exposure.
- No user input at this step; download is a GET request to a known URL.
