# Spec: Connect Frontend to POST /generate/script — Task 3.8

## User Story

**As a** content creator who has entered a story, chosen a style, and selected a voice,
**I want** the app to submit my choices to the backend and show me the generated script,
**So that** I can see what scenes will be in my video before the images and audio are generated.

## Context

Task 3.8 is the final integration step of the Week 3 wizard. After the user completes all three wizard steps (story → style → voice), clicking "Generar guión" calls `POST /generate/script` with a JWT-authenticated request. The response is async: the backend immediately returns a `jobId` with `status: 'pending'`. The frontend must poll `GET /generate/job/:jobId` until the job reaches `completed` or `failed`, then display the resulting script or an actionable error message.

## Acceptance Criteria

| ID | Criteria (EARS format) |
|----|------------------------|
| AC-1 | When the user clicks "Generar guión", the system shall call `POST /generate/script` with `{ story, style }` and the user's JWT in the Authorization header. |
| AC-2 | While the job is pending or processing, the system shall display a loading indicator with a descriptive label (e.g. "Analizando tu historia…"). |
| AC-3 | The system shall poll `GET /generate/job/:jobId` at most every 3 seconds until status is `completed` or `failed`. |
| AC-4 | When the job status is `completed`, the system shall display the generated script result to the user. |
| AC-5 | If the job status is `failed`, the system shall display a clear error message and a "Reintentar" button that resets the form to step 1. |
| AC-6 | If `POST /generate/script` returns a 429 (rate limit), the system shall display the message "Límite alcanzado. Intentá en un minuto." without showing a generic error. |
| AC-7 | If the network request fails (no connectivity or 5xx), the system shall display "Error de conexión. Revisá tu internet." and offer a retry. |
| AC-8 | While the job is in progress, the system shall disable the "Generar guión" button to prevent duplicate submissions. |
| AC-9 | The system shall stop polling automatically after 5 minutes and display a timeout error if the job has not completed. |

## Out of Scope

- Saving the generated script to the database on the frontend side (backend handles persistence).
- Displaying scene-by-scene progress (only final script for MVP).
- Starting the images or audio generation from this screen (Task 4.x scope).
- Caching the script result across browser sessions.

## Assumptions

- The Supabase session provides the JWT; it is accessible via `AuthContext` as `session.access_token`.
- The backend `POST /generate/script` accepts `{ story: string, style: StoryStyle }` and returns `{ jobId, status, createdAt }`.
- Polling interval of 3 seconds is acceptable given the 30-second max noted in backlog AC for script generation.
- `GET /generate/job/:jobId` returns `{ jobId, status, script?, message?, createdAt }`.

## Open Questions

| # | Question | Owner | Status | Decision |
|---|----------|-------|--------|----------|
| 1 | Should the script display be a modal, a new page, or an inline expansion? | Martin | Resolved | **Inline expansion** — script renders below the wizard steps on the same page; no navigation needed. |
| 2 | Does `GET /generate/job/:jobId` return the full script in the `result` field or a separate field? | Martin | Resolved | **Inside `result` field** — shape: `{ status, result: { script: string }, ... }`. Consistent with image/audio/video result shapes. |
| 3 | What is the expected p95 latency for script generation? (Sets polling UX expectations) | Martin | Resolved | **Under 15 seconds** — a simple spinner with a descriptive label is sufficient; no progress bar needed. |

## Dependencies

- Task 3.6 ✅ (when done) — provides `style` value
- Task 3.7 ✅ (when done) — provides `voiceId` (stored for Task 4.x, not sent here)
- `POST /generate/script` endpoint — already implemented in backend
- `GET /generate/job/:jobId` endpoint — already implemented in backend
- `AuthContext` — Supabase session token access
