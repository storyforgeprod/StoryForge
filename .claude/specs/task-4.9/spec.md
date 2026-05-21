# Spec: E2E Testing — Text to Downloadable Video — Task 4.9

## User Story

**As a** developer completing Week 4,
**I want** a verified end-to-end test run covering the full pipeline from story input to MP4 download,
**So that** all Week 4 tasks are confirmed working together before Week 5 stabilization.

## Context

Task 4.9 is the integration and smoke-test milestone for Week 4. It is not a new feature — it validates that Tasks 4.1–4.8 work as a chain. The test covers both the happy path (full success) and key failure modes (rate limit, job failure, network timeout).

The pipeline to test: story text → `POST /generate/script` → poll until script done → `POST /generate/images` → poll until images done → `POST /generate/audio` → poll until audio done → `POST /generate/video` → poll until video done → signed URL download.

## Acceptance Criteria

| ID | Criteria (EARS format) |
|----|------------------------|
| AC-1 | The system shall complete the full pipeline (story → downloadable MP4) within 10 minutes on a standard internet connection. |
| AC-2 | The frontend shall display the correct progress state at each wizard phase during the E2E run. |
| AC-3 | The downloaded MP4 shall be 1080×1920, ≤ 60 seconds, and playable in VLC or a browser. |
| AC-4 | The test shall verify the error path: submitting text < 50 characters shall block the wizard at step 1 with a visible validation error. |
| AC-5 | The test shall verify the retry path: if a generation job fails, the "Reintentar" button returns the wizard to the correct step. |
| AC-6 | All API calls shall use a real JWT (not a mock) from a test user account. |
| AC-7 | The test results and any issues found shall be recorded in the task-4.9 checklist and noted in `PROGRESS.md`. |

## Out of Scope

- Automated Playwright/Cypress E2E suite (manual testing is sufficient for MVP Week 4).
- Load testing or multi-user scenarios.
- Testing the staging environment (staging deploy is Week 6 scope).

## Assumptions

- All AI APIs (Claude, Replicate, ElevenLabs) are functional with valid keys in `.env.local`.
- A test user account exists in Supabase (created during Task 3.2).
- The backend runs locally or on the Render staging preview.
- FFmpeg or the serverless function (Task 4.5 or 4.6) is functional.

## Open Questions

| # | Question | Owner | Status | Decision |
|---|----------|-------|--------|----------|
| 1 | Should the E2E test use real AI APIs or a mock/stub backend? | Martin | Resolved | **Mock/stub backend** — faster and free; real API validation is out of scope for the automated test suite. Manual smoke test with real APIs is documented separately. |

## Dependencies

- Tasks 4.1–4.8 all complete
- All AI API keys available
- Frontend running on :5173; backend on :3000
