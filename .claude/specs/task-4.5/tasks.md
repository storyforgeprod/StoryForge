# Tasks: Backend FFmpeg Video Assembly — Task 4.5

## Summary

Total tasks: 4 | Estimated effort: L (≤ 8h)

## Checklist

- [x] TASK-4.5-01: Verify FFmpeg availability and Supabase `videos` bucket
- [x] TASK-4.5-02: Implement `assembleVideo` in `VideoService`
- [x] TASK-4.5-03: Wire `jobId` into `generateVideoContent` for temp dir naming
- [x] TASK-4.5-04: Integration test for `assembleVideo` with mock URLs

---

## Layer: Backend — Infrastructure

### TASK-4.5-01: Verify FFmpeg availability and Supabase `videos` bucket

**Layer:** Backend — Infrastructure
**Size:** S
**Depends on:** none
**Description:** (1) Confirm FFmpeg is on PATH in the Render runtime by adding a startup log: `exec('ffmpeg -version')`. If not available, document steps to add it to the Docker build or switch to Task 4.6's serverless path. (2) Create Supabase Storage bucket `videos` (if not already exists) with private RLS; service key bypasses RLS for server writes.
**Inputs:** Render deployment environment; Supabase dashboard
**Output / Done when:** `ffmpeg -version` logs successfully on backend startup; bucket `videos` exists in Supabase Storage.

---

### TASK-4.5-02: Implement `assembleVideo` in `VideoService`

**Layer:** Backend — Service
**Size:** L
**Depends on:** TASK-4.5-01
**Description:** Replace the stub in `backend/src/generate/video.service.ts`. Implement: (1) Create `/tmp/{jobId}/` directory. (2) Download all image URLs and audio URL in parallel with `Promise.all` + native `fetch` → write to temp files. (3) Calculate `secPerImage = audioLength / numImages`. (4) Build FFmpeg argument array using the concat filter from plan.md (1080×1920, scale+pad each image, libx264, aac). (5) Spawn FFmpeg; capture stderr; reject promise on non-zero exit code. (6) Upload `/tmp/{jobId}/output.mp4` to Supabase Storage at path `{userId}/{jobId}.mp4`. (7) Create signed URL (86400s = 24h expiry). (8) Delete `/tmp/{jobId}/` in finally block. Return signed URL.
**Inputs:** `video.service.ts` stub; plan.md FFmpeg command shape; `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` env vars; `@supabase/supabase-js` (already installed)
**Output / Done when:** Calling `assembleVideo` with real image + audio URLs produces a valid MP4 returned as a Supabase signed URL. Temp dir cleaned up. `npm run build` EXIT 0.

---

### TASK-4.5-03: Wire `jobId` into `generateVideoContent` for temp dir naming

**Layer:** Backend — Service
**Size:** S
**Depends on:** TASK-4.5-02
**Description:** In `generate.service.ts`, update the `generateVideoContent` call to pass `{ fps, bitrate, jobId: data.jobId }` as metadata so `assembleVideo` can use `jobId` for unique `/tmp` directory naming.
**Inputs:** `generate.service.ts` `generateVideoContent` method (lines ~537–591)
**Output / Done when:** `assembleVideo` receives `jobId` in metadata; no temp dir collisions between concurrent jobs.

---

## Layer: Testing

### TASK-4.5-04: Integration test for `assembleVideo` with mock URLs

**Layer:** Testing
**Size:** M
**Depends on:** TASK-4.5-02
**Description:** Jest integration test (not unit — needs real FFmpeg). Use a small publicly accessible test image URL and a short test audio URL. Call `assembleVideo` directly. Assert: returns a string URL; URL contains `supabase` or `localhost` (depending on test config); temp dir is removed after completion. Mark test with `@slow` tag; skip in CI if FFmpeg is not available.
**Inputs:** Real FFmpeg binary; test image/audio URLs (can be public sample files)
**Output / Done when:** Test passes locally with FFmpeg installed; `npm run test` handles skip gracefully in CI.

---

## Task Dependency Map

```
TASK-4.5-01 → TASK-4.5-02 → TASK-4.5-03
                    ↓
              TASK-4.5-04
```
