# Spec: Backend FFmpeg Video Assembly — Task 4.5

## User Story

**As a** developer,
**I want** `VideoService.assembleVideo()` to produce a real MP4 9:16 file from image URLs and an audio URL,
**So that** the `POST /generate/video` endpoint can return a downloadable video to the user.

## Context

`VideoService.assembleVideo()` is currently a stub returning an empty string. Task 4.5 implements the FFmpeg-based assembly logic: download images and audio from their CDN/Storage URLs, run FFmpeg to create a 1080×1920 MP4 with the images as a slideshow synced to the audio, then upload the result to Supabase Storage and return a signed URL. This is the core compute step for Historia de Usuario 1.4.

The `POST /generate/video` endpoint and queue processor are already wired; only `VideoService` needs implementation.

## Acceptance Criteria

| ID | Criteria (EARS format) |
|----|------------------------|
| AC-1 | When `assembleVideo(imageUrls, audioUrl, metadata)` is called, the system shall produce a valid MP4 file at 1080×1920 resolution. |
| AC-2 | The output video shall have subtitles burned in if a `subtitles` array is provided in metadata (deferred to AC-2b for MVP: subtitles are optional). |
| AC-3 | The output video duration shall not exceed 60 seconds. |
| AC-4 | The system shall upload the assembled MP4 to Supabase Storage and return a signed URL valid for 24 hours. |
| AC-5 | The total assembly time shall not exceed 3 minutes for a 60-second video. |
| AC-6 | If FFmpeg exits with a non-zero code, the system shall throw an error with the FFmpeg stderr output included. |
| AC-7 | Temporary files (downloaded images, audio, intermediate files) shall be deleted after assembly succeeds or fails. |

## Out of Scope

- Custom transitions between images (simple slideshow for MVP).
- Watermarks or overlays beyond subtitles.
- Hardware-accelerated encoding (software x264 for MVP).
- Subtitle implementation (AC-2b; deferred to post-MVP).

## Assumptions

- FFmpeg is available in the runtime environment (`ffmpeg` on PATH in Render's Docker image or installed in the serverless container).
- Supabase Storage bucket `videos` exists with appropriate RLS policies.
- `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` env vars are available to the backend.
- Images are accessible via public URLs (Replicate CDN); audio via public URL (ElevenLabs or Supabase Storage).

## Open Questions

| # | Question | Owner | Status | Decision |
|---|----------|-------|--------|----------|
| 1 | Is FFmpeg available on Render's Node.js runtime, or does it require a custom Docker build? | DevOps | Resolved | **Available natively on Render** — no custom Docker image needed. |
| 2 | Should each image display for equal duration (audioLength / numImages) or be driven by script timestamps? | Dev | Resolved | **Equal duration** — `audioLength / numImages`. Simple and predictable for MVP. |
| 3 | Is the `videos` bucket in Supabase Storage already created? | Backend dev | Resolved | **Unknown — assume not created.** Add bucket creation as a setup step before implementation. |

## Dependencies

- `VideoService` stub — `backend/src/generate/video.service.ts`
- `GenerateVideoContent` in `generate.service.ts` — already calls `videoService.assembleVideo()`
- Supabase Storage — bucket `videos` must exist
- FFmpeg — available in server runtime
- Task 4.6 — serverless alternative (if FFmpeg on Render proves infeasible)
