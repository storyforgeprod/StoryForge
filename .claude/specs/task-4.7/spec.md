# Spec: Connect Frontend to /generate/video — Task 4.7

## User Story

**As a** frontend developer,
**I want** a typed service function and polling hook for the video assembly endpoint,
**So that** Task 4.8 can trigger video generation and present the download link without duplicating HTTP or polling logic.

## Context

Task 4.7 mirrors what Task 4.1 did for images and audio. It adds `postGenerateVideo` to `generateApi.ts` and creates `useGenerateVideo` hook. The hook polls `GET /generate/job/:jobId` until the video job completes, then surfaces the signed Supabase URL for download. No UI is delivered here.

Backend contract: `POST /generate/video` requires BOTH `imageJobId` and `audioJobId` to be in `completed` state. The endpoint validates this and returns 400 if either is not done.

## Acceptance Criteria

| ID | Criteria (EARS format) |
|----|------------------------|
| AC-1 | The system shall export `postGenerateVideo({ imageJobId, audioJobId, fps?, bitrate? }, token)` from `generateApi.ts`. |
| AC-2 | `useGenerateVideo` shall expose `{ state, generate, reset }` following the same state-machine pattern as other generation hooks. |
| AC-3 | The hook shall poll every 3 seconds and time out after 240 seconds (4 minutes), matching the backend 3-minute assembly SLA plus buffer. |
| AC-4 | When the job completes, the hook state shall contain `videoUrl: string`, `duration: number`, and `fileSize: number`. |
| AC-5 | If the backend returns 400 (image/audio job not ready), the hook shall surface "Las imágenes o el audio aún no están listos." |
| AC-6 | The hook shall guard against duplicate `generate()` calls while in-flight. |
| AC-7 | Polling intervals shall be cleared on component unmount. |

## Out of Scope

- Any download UI (Task 4.8 scope).
- Triggering images or audio automatically before video.

## Assumptions

- `imageJobId` and `audioJobId` are available in `Generate.tsx` state from Tasks 4.2 and 4.3.
- `useGenerateImages` and `useGenerateAudio` hooks from Task 4.1 already confirmed `completed` status before video is triggered.
- `VideoAssemblyResult` type (`videoUrl`, `duration`, `fileSize`, `format`) is already in backend types; needs to be mirrored in `frontend/src/types/generate.ts`.

## Open Questions

| # | Question | Owner | Status | Decision |
|---|----------|-------|--------|----------|
| 1 | Is `videoUrl` the Supabase signed URL or a proxy URL through the backend? | Backend dev | Resolved | **Supabase signed URL** — short-lived (24h), directly playable/downloadable by the browser without a backend proxy. |

## Dependencies

- Task 4.1 — `generateApi.ts` base and polling pattern
- Task 4.2 ✅ (when done) — `imageJobId` in state
- Task 4.3 ✅ (when done) — `audioJobId` in state
- Task 4.8 — consumes `useGenerateVideo`
