# Spec: Serverless Video Assembly — Task 4.6

## User Story

**As a** developer,
**I want** an alternative serverless video assembly path that does not require FFmpeg on the Render server,
**So that** the pipeline can scale without maintaining a stateful compute instance.

## Context

Task 4.6 implements Historia de Usuario 3.3 (Ensamblado serverless). It is an architectural alternative or complement to Task 4.5. If FFmpeg on Render proves feasible (Task 4.5), Task 4.6 can be deferred. If not, this is the primary video assembly path.

The serverless approach uses an external function (e.g. Modal Labs, AWS Lambda with FFmpeg layer, or a Render background worker with FFmpeg) that accepts image URLs, an audio URL, and subtitle timestamps, and returns a Supabase Storage signed URL for the assembled MP4.

The `VideoService.assembleVideo()` interface is already defined; Task 4.6 either replaces its internals (if 4.5 is infeasible) or adds a configurable strategy pattern.

## Acceptance Criteria

| ID | Criteria (EARS format) |
|----|------------------------|
| AC-1 | The system shall accept `imageUrls[]`, `audioUrl`, and optional `subtitles[]` with timestamps as input. |
| AC-2 | The output shall be a 1080×1920 MP4 with burned-in SRT subtitles (if provided) and a duration ≤ 60 seconds. |
| AC-3 | The assembled video shall be uploaded to Supabase Storage and a signed URL returned (24h expiry). |
| AC-4 | The assembly time shall not exceed 3 minutes for a 60-second video. |
| AC-5 | The signed URL shall expire after 24 hours. |
| AC-6 | If the serverless function fails, the system shall propagate a structured error to the Bull Queue job record. |
| AC-7 | The assembly approach shall be selectable via an environment variable (`VIDEO_ASSEMBLY_STRATEGY: 'local' | 'serverless'`) to allow fallback to Task 4.5.

## Out of Scope

- Building a custom serverless platform.
- Real-time streaming assembly.
- Hardware-accelerated encoding.
- Subtitle generation (only burn-in of provided SRT strings).

## Assumptions

- The preferred serverless target is Modal Labs or a Render background worker (decision pending — see Open Questions).
- `SUPABASE_SERVICE_KEY` is available to the serverless function.
- The serverless function is invoked via an HTTP call, not a direct library import.

## Open Questions

| # | Question | Owner | Status | Decision |
|---|----------|-------|--------|----------|
| 1 | Which serverless platform: Modal Labs, AWS Lambda, or Render background worker? | Martin / DevOps | Resolved | **Skip if Task 4.5 works on Render.** Task 4.6 is only implemented if local FFmpeg on Render proves infeasible. |
| 2 | If Task 4.5 (local FFmpeg) works on Render, should 4.6 still be implemented? | Martin | Resolved | **No** — Task 4.5 success makes 4.6 out of scope for MVP. |
| 3 | Who hosts the serverless function? Same Render account or separate? | DevOps | Resolved | **Moot** — deferred pending Task 4.5 outcome (see Q1). |

## Dependencies

- Task 4.5 — local FFmpeg alternative; one of the two must be viable
- `VIDEO_ASSEMBLY_STRATEGY` env var — needs to be added to `.env.production`
- Serverless platform account — required before implementation
- Supabase Storage bucket `videos` — needed by both 4.5 and 4.6
