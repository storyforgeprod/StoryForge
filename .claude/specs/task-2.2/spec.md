# Task 2.2 — Integration Testing /generate/script

## What was built
End-to-end validation that the script generation endpoint creates real Prisma Job records and returns real job IDs when called with a live Anthropic API key and Supabase database.

## Acceptance criteria

- The system SHALL create a Job record in Prisma when POST /generate/script is called
- The system SHALL return a real Prisma job ID (not a generated UUID) in the response
- The system SHALL return status=failed and update the Job if the Claude API call fails
- The system SHALL enforce JWT authentication (401 if no token)
- The system SHALL allow polling GET /generate/job/:jobId for the created job

## Dependencies
- Task 2.1 (Prisma Job Integration)
- Live ANTHROPIC_API_KEY
- Supabase DATABASE_URL configured
