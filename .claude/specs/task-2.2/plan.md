# Task 2.2 — Implementation Plan

## Approach
Manual integration testing via curl against running local backend. Verify DB state via Prisma Studio or direct query after each call.

## Test scenarios
1. Happy path — valid JWT + valid story → Job created, status=completed, real jobId returned
2. Auth failure — no JWT → 401
3. Validation failure — empty story → 400
4. DB verification — GET /generate/job/:jobId returns job with result populated

## Commands
```bash
# Start backend
cd backend && npm run start:dev

# Generate script
curl -X POST http://localhost:3000/generate/script \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"story":"A hero finds treasure","style":"anime"}'

# Poll job
curl http://localhost:3000/generate/job/<jobId> \
  -H "Authorization: Bearer <JWT>"
```
