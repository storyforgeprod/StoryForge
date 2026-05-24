# Task 2.7 — Rate Limiting & API Security

## What was built
Per-endpoint rate limiting on all POST /generate/* routes using `@nestjs/throttler`. ThrottlerGuard registered globally; each endpoint has independent limits calibrated to API costs.

## Acceptance criteria

- The system SHALL reject requests exceeding the per-endpoint limit with HTTP 429
- The system SHALL apply rate limits: script=5/min, images=10/min, audio=15/min, video=10/min
- The system SHALL reset the counter after the TTL window (60 seconds)
- The system SHALL return POST /generate/script with HTTP 202 Accepted (async pattern)
- The system SHALL allow rate limits to be configured via environment variables

## Dependencies
- Task 2.6 (all endpoints implemented)
- @nestjs/throttler installed
