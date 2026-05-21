# Spec: MP4 Export and Download UI — Task 4.8

## User Story

**As a** content creator,
**I want** to trigger video assembly and download the finished MP4 9:16 with one click,
**So that** I can upload it to YouTube Shorts without any additional editing.

## Context

Task 4.8 is the final step of the generation wizard. After audio is confirmed (Task 4.3), the user triggers video assembly via `useGenerateVideo` (Task 4.7). When the job completes, a download button becomes available, pointing to the Supabase signed URL. The video is 1080×1920, encoded with libx264+aac, ≤ 60 seconds. This implements Historia de Usuario 1.4.

## Acceptance Criteria

| ID | Criteria (EARS format) |
|----|------------------------|
| AC-1 | When audio is confirmed, the system shall show a "Generar video" button that the user must click to start assembly. |
| AC-2 | While video is assembling, the system shall display a loading indicator with a label "Ensamblando tu video…" and the `PipelineProgress` video stage as active. |
| AC-3 | When the video job completes, the system shall display a "Descargar MP4" button that triggers a browser download of the signed URL. |
| AC-4 | The download button shall show the file size in a human-readable format (e.g. "12 MB"). |
| AC-5 | The system shall display the video duration in seconds next to the download button. |
| AC-6 | The system shall show a note: "El enlace de descarga expira en 24 horas." |
| AC-7 | If video assembly fails, the system shall display an error message and a "Reintentar" button. |
| AC-8 | The total time from story text input to download shall not exceed 10 minutes (end-to-end pipeline SLA from backlog). |
| AC-9 | While video is assembling, navigation away shall be disabled. |

## Out of Scope

- In-browser video preview/playback.
- Sharing directly to YouTube (post-MVP).
- Re-generating the video with different parameters from this screen.

## Assumptions

- `imageJobId` and `audioJobId` are in `Generate.tsx` state.
- `useGenerateVideo` from Task 4.7 is available.
- The signed URL from Supabase triggers a direct download when used as `<a href=... download>`.
- File size is formatted from the `fileSize` bytes value in the result.

## Open Questions

| # | Question | Owner | Status | Decision |
|---|----------|-------|--------|----------|
| 1 | Should a video preview player be shown after download completes? | Martin | Resolved | **Yes** — display an HTML5 `<video>` element with the `videoUrl` before the download button so users can preview before downloading. |
| 2 | Should the user be able to start a new generation from the done state? | Martin | Resolved | **Yes** — show a "Nueva historia" button that resets the wizard to step 1. |

## Dependencies

- Task 4.3 ✅ (when done) — audio confirmed; `audioJobId` in state
- Task 4.7 — `useGenerateVideo` hook
- Task 4.4 — `PipelineProgress` video stage
- Tasks 4.5 or 4.6 — backend video assembly must work
