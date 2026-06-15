# Spec: Real-Time Pipeline Progress Indicator — Task 4.4

## User Story

**As a** user waiting for my video to be generated,
**I want** to see what the system is doing at each step of the pipeline,
**So that** I understand the progress and don't think the app is broken during long waits.

## Context

Task 4.4 adds a persistent progress indicator to the generation wizard in `Generate.tsx`. It visualizes which pipeline stage is active or complete (script → images → audio → video) and maps the `progress` percentage from `GET /generate/job/:jobId` to a visual bar or step indicator. This is the bonus scope for Historia de Usuario 2.2 (Visualización del progreso).

The `progress` field is already returned by the backend: `GET /generate/job/:jobId` returns `{ status, progress: 0–100, ... }`. The queue processor sets it: 0 (pending), 25 (processing start), 100 (completed).

## Acceptance Criteria

| ID | Criteria (EARS format) |
|----|------------------------|
| AC-1 | The system shall display a horizontal step indicator showing the four pipeline stages: Guión, Imágenes, Audio, Video. |
| AC-2 | The system shall visually distinguish completed stages (filled/green), the active stage (highlighted), and pending stages (muted). |
| AC-3 | While a job is polling, the system shall show a progress bar or percentage that updates in real time from the `progress` field. |
| AC-4 | When a stage completes, the system shall transition its visual state to complete without a page reload. |
| AC-5 | The progress indicator shall be visible at all pipeline stages (including idle-before-generation). |
| AC-6 | If a stage fails, the system shall mark that stage with an error state. |
| AC-7 | The progress indicator shall not obstruct the main content of each wizard step. |

## Out of Scope

- WebSocket-based real-time updates (polling is sufficient for MVP).
- Per-scene granular progress within the images step.
- Persisting progress state across browser refreshes.

## Assumptions

- `progress` values from the backend are coarse (0 / 25 / 100); the indicator uses stage-level states, not granular percentages.
- The component lives at the top of `Generate.tsx` as a persistent header element.
- No routing changes needed.

## Open Questions

| # | Question | Owner | Status | Decision |
|---|----------|-------|--------|----------|
| 1 | Should the progress indicator show estimated time remaining? | Martin | Resolved | **No ETA** — stage labels + active/done/error states only. Avoids inaccurate estimates that frustrate users. |

## Dependencies

- Task 3.8 ✅ — script phase hook available
- Task 4.1 — images and audio hooks available
- Task 4.7 — video hook (to mark video stage progress)
