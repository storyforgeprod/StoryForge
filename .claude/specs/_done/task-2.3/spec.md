# Task 2.3 — Bull Queue Processor

## What was built
Async generation pipeline using Bull + Redis. GenerateService was refactored from synchronous (blocking client) to async (returns pending jobId immediately, processes in background via queue processor).

## Acceptance criteria

- The system SHALL return `{jobId, status: "pending"}` immediately on POST /generate/script without waiting for Claude
- The system SHALL process jobs asynchronously via a Bull queue backed by Redis
- The system SHALL update Job progress from pending → processing (25%) → completed (100%)
- The system SHALL store the result in Job.result as JSON on completion
- The system SHALL update Job.status to "failed" and store the error message if processing throws
- The system SHALL automatically retry failed jobs per Bull retry configuration
- The system SHALL allow clients to poll GET /generate/job/:jobId to track progress

## Dependencies
- Task 2.1 (Prisma Job Integration)
- Redis instance (local or Upstash)
