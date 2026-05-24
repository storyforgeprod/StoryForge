# Task 2.1 — Prisma Job Integration

## What was built
Integrated PrismaService into GenerateService so every generation creates a persistent Job record in the database. Added `GET /generate/job/:jobId` for job status polling. Secured all endpoints with JwtAuthGuard.

## Acceptance criteria

- The system SHALL create a Job record (status=processing) in Prisma BEFORE calling Claude API
- The system SHALL update the Job with result and status=completed AFTER Claude API responds
- The system SHALL update the Job with status=failed if Claude API throws
- The system SHALL return the real Prisma Job ID (not a hardcoded UUID) in every response
- The system SHALL expose `GET /generate/job/:jobId` returning status, progress, result, processingTimeMs
- The system SHALL only allow a job's creator (by userId) to access its status
- The system SHALL require a valid JWT on all `/generate/*` endpoints

## Dependencies
- Prisma schema with Job model (Week 1)
- JwtAuthGuard + CurrentUser decorator (Week 1)
