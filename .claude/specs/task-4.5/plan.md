# Technical Plan: Backend FFmpeg Video Assembly — Task 4.5

## High-Level Architecture

```
generateVideoContent() [generate.service.ts]
  └── videoService.assembleVideo(imageUrls, audioUrl, { fps, bitrate })
        ├── 1. Download images → /tmp/{jobId}/img_N.jpg
        ├── 2. Download audio  → /tmp/{jobId}/audio.mp3
        ├── 3. Build FFmpeg args (concat filter, scale 1080x1920, x264)
        ├── 4. Spawn FFmpeg process → /tmp/{jobId}/output.mp4
        ├── 5. Upload output.mp4 → Supabase Storage bucket: videos/{userId}/{jobId}.mp4
        ├── 6. Create signed URL (24h expiry)
        ├── 7. Cleanup /tmp/{jobId}/
        └── 8. Return signed URL
```

## Components Affected

| Component | Change Type | Notes |
|-----------|-------------|-------|
| `backend/src/generate/video.service.ts` | Modified | Implement `assembleVideo`; add `uploadToSupabase` private method |
| `backend/src/generate/generate.service.ts` | No change | Already calls `videoService.assembleVideo()` |

## Architecture Decision Records

### ADR-1: Spawn FFmpeg as a child process with `execa` or Node's `child_process.spawn`

- **Context:** Node.js needs to run FFmpeg as an external binary. Options: fluent-ffmpeg (wrapper), `execa`, or raw `child_process`.
- **Decision:** Use `child_process.spawn` with a promise wrapper to capture stdout/stderr. No additional dependency.
- **Rationale:** Avoids adding fluent-ffmpeg; the FFmpeg command is simple enough to construct manually.
- **Trade-offs:** Must manually build the FFmpeg argument array; documented in `_buildFfmpegArgs()`.

### ADR-2: Image display duration = audioLength / numImages

- **Context:** We need to know how long each image shows. Script timestamps are not yet structured data.
- **Decision:** Divide total audio duration by number of images for even distribution.
- **Rationale:** Simple and correct for MVP. Post-MVP can use scene timestamps from the script.
- **Trade-offs:** No scene-pacing variation.

### ADR-3: Upload to Supabase Storage via `@supabase/supabase-js` service client

- **Context:** The backend needs to write files to Supabase Storage.
- **Decision:** Use the existing `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` to instantiate a server-side Supabase client inside `VideoService`.
- **Rationale:** Consistent with the rest of the backend's Supabase usage.
- **Trade-offs:** Adds a direct Supabase client to `VideoService`; acceptable for MVP.

### ADR-4: Use `/tmp/{jobId}/` as working directory; always clean up

- **Context:** Render's ephemeral filesystem allows `/tmp` writes. Files must be cleaned up to avoid filling the disk.
- **Decision:** Create a unique directory per job at `/tmp/{jobId}/`; delete it in a `finally` block regardless of success or failure.
- **Rationale:** Prevents disk buildup on long-running instances.
- **Trade-offs:** If the process is killed mid-job, the cleanup doesn't run — acceptable for MVP.

## FFmpeg Command Shape

```
ffmpeg
  -loop 1 -t {secPerImage} -i img_0.jpg
  -loop 1 -t {secPerImage} -i img_1.jpg
  ...
  -i audio.mp3
  -filter_complex "
    [0:v]scale=1080:1920:force_original_aspect_ratio=decrease,
         pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1[v0];
    [1:v]scale=...pad...[v1];
    ...
    [v0][v1]...concat=n={N}:v=1:a=0[outv]
  "
  -map "[outv]" -map {audioIndex}:a
  -c:v libx264 -preset fast -crf 23
  -c:a aac -b:a 128k
  -t 60
  -movflags +faststart
  output.mp4
```

## API Contract

`assembleVideo` signature (already defined in the stub):
```ts
async assembleVideo(
  images: string[],    // public image URLs
  audioPath: string,   // public audio URL (or local path)
  metadata: {
    fps?: number;      // default 30
    bitrate?: string;  // default '2000k'
    jobId?: string;    // for tmp dir naming
  },
): Promise<string>     // returns signed Supabase Storage URL
```

## Security Considerations

- Supabase `SUPABASE_SERVICE_KEY` has full Storage access — never expose client-side.
- Signed URL expires in 24h to limit storage costs (per backlog AC).
- Input URLs are downloaded before passing to FFmpeg — no shell injection risk from URL strings.

## Performance Considerations

- Assembly target: < 3 minutes for 60s video.
- FFmpeg `preset fast` trades slightly larger output for faster encoding.
- `/tmp` writes are to ephemeral disk; no network latency for intermediate files.
- Parallel image downloads with `Promise.all` before FFmpeg starts.

## Observability

- Log FFmpeg stderr on error.
- Log assembly start/end with `processingTimeMs`.
- Log Supabase upload success/failure.
