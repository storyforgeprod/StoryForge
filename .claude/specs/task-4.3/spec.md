# Spec: Voice Narration UI — Task 4.3

## User Story

**As a** content creator,
**I want** the app to generate audio narration from my script using the voice I selected,
**So that** I can hear the narration and confirm the tone before the video is assembled.

## Context

Task 4.3 implements the audio generation step (step 5 of the pipeline wizard) in `Generate.tsx`. After images are confirmed (Task 4.2), the user triggers audio generation. The frontend calls `POST /generate/audio` via `useGenerateAudio` (Task 4.1) with the `scriptId` and the `voiceId` selected in Task 3.7. When complete, a playback player is shown before the user proceeds to video assembly. This corresponds to Historia de Usuario 1.3.

Key backend constraint: `POST /generate/audio` requires the script job to have `status === 'completed'` before it will accept the request. The endpoint validates this server-side.

## Acceptance Criteria

| ID | Criteria (EARS format) |
|----|------------------------|
| AC-1 | When images are confirmed, the system shall show a "Generar narración" button that the user must click to start. |
| AC-2 | While audio is being generated, the system shall display a loading indicator and disable navigation. |
| AC-3 | When audio generation completes, the system shall display an inline audio player for the user to preview the narration. |
| AC-4 | The audio player shall support play, pause, and a progress scrubber. |
| AC-5 | When audio is available, the system shall show the estimated duration in seconds next to the player. |
| AC-6 | If audio generation fails, the system shall display an error message and a "Reintentar" button. |
| AC-7 | The system shall complete audio generation within 30 seconds (timeout after that with a user-facing message). |
| AC-8 | After audio is confirmed, the system shall enable a "Continuar al video" button. |
| AC-9 | The library shall show at least 2 voices with differentiable tones (bridged from Task 3.7 — `voiceId` already captured). |

## Out of Scope

- Re-selecting the voice after this step (user chose it in step 3).
- Downloading the audio file separately.
- Generating multiple narration takes.

## Assumptions

- `scriptJobId` and `voiceId` are available in `Generate.tsx` state from Tasks 3.8 and 3.7.
- `useGenerateAudio` from Task 4.1 is available.
- The backend `ElevenLabsService` will be properly implemented before this task is tested end-to-end.
- The `audioUrl` returned by the backend is a publicly accessible URL (Supabase Storage or ElevenLabs CDN).

## Open Questions

| # | Question | Owner | Status | Decision |
|---|----------|-------|--------|----------|
| 1 | Is `audioUrl` a Supabase Storage URL (requires auth headers to stream) or a public ElevenLabs CDN URL? | Backend dev | Resolved | **Supabase Storage signed URL (1-hour expiry)** — audio stored in project bucket; signed URL is directly streamable by `<audio>` without auth headers. ElevenLabs CDN URLs are ephemeral and unreliable for playback. |
| 2 | Should the user be able to re-trigger audio with a different voice at this step? | Martin | Resolved | **No** — voice is locked after generation. Voice was chosen in wizard step 3; no retry in MVP. |

## Dependencies

- Task 3.7 ✅ (when done) — `voiceId` in state
- Task 3.8 ✅ (when done) — `scriptJobId` in state
- Task 4.1 — `useGenerateAudio` hook
- Task 4.2 ✅ (when done) — images confirmed; pipeline at audio step
- `POST /generate/audio` — implemented in backend
