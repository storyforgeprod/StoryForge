# Spec: Connect Frontend to /generate/images and /generate/audio — Task 4.1

## User Story

**As a** frontend developer,
**I want** typed service functions and polling hooks for the images and audio endpoints,
**So that** Tasks 4.2 and 4.3 can consume them without duplicating HTTP or polling logic.

## Context

Task 3.8 created `generateApi.ts` and `useGenerateScript`. Task 4.1 extends that same service layer with two new functions (`postGenerateImages`, `postGenerateAudio`) and two new hooks (`useGenerateImages`, `useGenerateAudio`). These are the integration plumbing that Tasks 4.2 and 4.3 will consume; no UI is delivered in this task.

Key facts from backend:
- `POST /generate/images` accepts `{ scriptId, style, imageDescription? }` — the `style` field is added to `GenerateImagesDto` as part of Task 4.2 (TASK-4.2-04).
- `POST /generate/audio` accepts `{ scriptId, voiceId? }`.
- Both return `{ jobId, status: 'pending', createdAt }` immediately.
- `GET /generate/job/:jobId` returns `{ id, status, progress, result, error, completedAt }`.
- Image result shape: `{ imageUrls: string[], prompt: string, generatedAt: Date }`.
- Audio result shape: `{ audioUrl: string, audioLength: number, textUsed: string, generatedAt: Date }`.

## Acceptance Criteria

| ID | Criteria (EARS format) |
|----|------------------------|
| AC-1 | The system shall export `postGenerateImages(body, token)` from `generateApi.ts` that POSTs to `/generate/images` with JWT header and returns typed response. |
| AC-2 | The system shall export `postGenerateAudio(body, token)` from `generateApi.ts` that POSTs to `/generate/audio` with JWT header and returns typed response. |
| AC-3 | `useGenerateImages` hook shall expose `{ state, generate, reset }` with the same state-machine pattern as `useGenerateScript`. |
| AC-4 | `useGenerateAudio` hook shall expose `{ state, generate, reset }` with the same state-machine pattern as `useGenerateScript`. |
| AC-5 | Both hooks shall poll `GET /generate/job/:jobId` every 3 seconds and stop on `completed` or `failed`. |
| AC-6 | Both hooks shall time out after 90 seconds for images and 30 seconds for audio, surfacing a user-facing error message. |
| AC-7 | If `generate()` is called while a job is already in-flight, the system shall ignore the duplicate call. |
| AC-8 | The system shall clean up polling intervals on component unmount. |

## Out of Scope

- Any UI rendering (that is Task 4.2 and 4.3).
- Adding `style` to `GenerateImagesDto` on the backend (US-40 TASK-001).
- Parallel invocation of images and audio simultaneously.

## Assumptions

- `generateApi.ts` already exists from Task 3.8 and exports `getJobStatus`.
- `getJobStatus` is shared by all hooks — no duplication needed.
- Timeout values: 90s for images (Replicate can be slow), 30s for audio (ElevenLabs is faster).

## Open Questions

| # | Question | Owner | Status | Decision |
|---|----------|-------|--------|----------|
| 1 | Should `useGenerateImages` and `useGenerateAudio` be in separate files or one `useGenerate.ts`? | Dev | Resolved | **Separate files** — `useGenerateImages.ts` and `useGenerateAudio.ts`. Easier to test and tree-shake independently. |

## Dependencies

- Task 3.8 ✅ — `generateApi.ts` base + `getJobStatus` function
- `POST /generate/images` endpoint — implemented in backend
- `POST /generate/audio` endpoint — implemented in backend
- Task 4.2 — consumes `useGenerateImages`
- Task 4.3 — consumes `useGenerateAudio`
