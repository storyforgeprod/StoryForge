# Task 2.7 — Implementation Plan

## Approach
Register ThrottlerGuard as a global APP_GUARD in AppModule so it applies to all routes without per-route boilerplate. Override per endpoint with @Throttle() decorator to set custom limits.

## Files modified
| File | Change |
|------|--------|
| `backend/src/app.module.ts` | +APP_GUARD provider with ThrottlerGuard |
| `backend/src/generate/generate.controller.ts` | +@Throttle decorator on each POST endpoint; 200→202 on /script |
| `backend/src/main.ts` | Removed manual ThrottlerGuard instantiation |
| `.env.example` | +RATE_LIMIT_* variables documented |
| `backend/.env.local` | +RATE_LIMIT_* defaults for development |

## Rate limits chosen
| Endpoint | Limit | Reason |
|---|---|---|
| /script | 5/min | Expensive Claude API call |
| /images | 10/min | Replicate ~$0.01/image |
| /audio | 15/min | ElevenLabs allows more |
| /video | 10/min | CPU-intensive FFmpeg |
