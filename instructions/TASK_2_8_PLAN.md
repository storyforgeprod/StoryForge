# TASK 2.8 PLAN: Documentation & Handoff

**Status:** ⏳ READY TO IMPLEMENT  
**Estimated Time:** 2-3 hours  
**Depends On:** ✅ Task 2.7 (Rate Limiting) COMPLETED  
**Target Completion:** May 17, 2026 Evening UTC  
**MVP Impact:** 76% → 80% (Documentation tier)

---

## 📋 Objective

Create comprehensive documentation package for MVP launch:
- API endpoint reference with examples
- Deployment guide for production
- Troubleshooting & debugging guide
- Handoff notes for next developer
- Architecture diagram
- Rate limiting documentation

---

## 🎯 PASOS (6 Total)

### PASO 1: API Endpoints Documentation
**File:** `API_ENDPOINTS.md` (NEW)  
**Objective:** Document all 5 POST endpoints with request/response examples

**Content Required:**
```markdown
# API Endpoints Reference

## POST /generate/script
- Throttle limit: 5 requests/min
- Input: GenerateScriptDto {story}
- Output: GenerateScriptResponseDto {jobId, status: 'pending'}
- Example cURL:
  curl -X POST http://localhost:3000/generate/script \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"story":"...long text..."}'
- Response:
  {"jobId":"job_xxx","status":"pending","createdAt":"2026-05-17T02:00:00Z"}

## POST /generate/images
- Throttle limit: 10 requests/min
- Depends: POST /script first
- Input: GenerateImagesDto {scriptId, imageDescription?}
- Output: GenerateImagesResponseDto {jobId, status: 'pending'}

## POST /generate/audio
- Throttle limit: 15 requests/min
- Depends: POST /script first
- Input: GenerateAudioDto {scriptId, voiceId?}
- Output: GenerateAudioResponseDto {jobId, status: 'pending'}

## POST /generate/video
- Throttle limit: 10 requests/min
- Depends: POST /images AND POST /audio first
- Input: GenerateVideoDto {imageJobId, audioJobId, fps?, bitrate?}
- Output: GenerateVideoResponseDto {jobId, status: 'pending'}

## GET /generate/job/:jobId
- Poll job status (no rate limit)
- Response: {status, progress (0-100), result}
- Example:
  GET /generate/job/job_xxx → {status:'completed', progress:100, result:{...}}
```

**Acceptance Criteria:**
- ✅ All 5 endpoints documented
- ✅ Throttle limits clearly noted
- ✅ Request/response examples provided
- ✅ Dependencies between endpoints clear
- ✅ cURL examples executable

---

### PASO 2: Architecture & Technical Documentation
**File:** `ARCHITECTURE.md` (NEW)  
**Objective:** Explain system design, async patterns, and data flow

**Content Required:**
```markdown
# StoryForge Backend Architecture

## Async Queue Pattern

All generation endpoints follow identical pattern:
1. Client calls POST /generate/{type}
2. Server creates Job(pending) in DB
3. Job added to Bull queue
4. Server returns jobId immediately (202 Accepted)
5. Queue processor picks up job (auto, background)
6. Processor executes business logic (Claude/Replicate/ElevenLabs/FFmpeg)
7. Job result saved to DB (status: completed)
8. Client polls GET /job/:jobId to track progress

## System Components

### Frontend (React + Vite)
- Location: /frontend
- Port: 5173
- Dependencies: Project interface, file upload, progress tracking

### Backend (NestJS + TypeScript)
- Location: /backend
- Port: 3000
- Components:
  - Controllers: API routes (/generate/*)
  - Services: Business logic (GenerateService)
  - Processors: Background jobs (GenerateQueueProcessor)
  - Integrations: External APIs (Claude, Replicate, ElevenLabs, FFmpeg)

### Database (Supabase PostgreSQL)
- Models: User, Project, Job, Output, Event
- Job table: id, userId, type, status, progress, result, error

### Queue (Redis + Bull)
- Purpose: Async job processing
- Queue name: 'generation'
- Processor: GenerateQueueProcessor
- Retry: 3 attempts with exponential backoff

## External API Integrations

| API | Purpose | Cost | Throttle |
|---|---|---|---|
| Claude 3.5 Sonnet | Script generation | ~$0.10/req | 5/min |
| Replicate (Flux) | Image generation | ~$0.01/image | 10/min |
| ElevenLabs | Text-to-speech | ~$0.01/min | 15/min |
| FFmpeg | Video assembly | $0 (local) | 10/min |
```

**Acceptance Criteria:**
- ✅ Async pattern clearly explained
- ✅ Component diagram included (text-based or mermaid)
- ✅ Data flow documented
- ✅ API integration costs noted
- ✅ Rate limiting matrix shown

---

### PASO 3: Deployment & Setup Guide
**File:** `DEPLOYMENT.md` (NEW)  
**Objective:** Step-by-step production deployment instructions

**Content Required:**
```markdown
# Deployment Guide

## Prerequisites
- Node.js 18+
- PostgreSQL (or Supabase)
- Redis
- FFmpeg (for video endpoint)
- Environment variables configured

## Local Development Setup

1. Clone repository
2. Install dependencies:
   npm install (root)
   cd backend && npm install
   cd frontend && npm install

3. Configure environment:
   cp .env.example .env.local
   # Edit with your API keys

4. Database setup:
   cd backend
   npm run prisma:migrate
   npm run prisma:generate

5. Start backend:
   npm run start:dev

6. Start frontend:
   cd frontend
   npm run dev

## Production Deployment (Render/Vercel)

### Backend Deployment (Render)
- Environment: Node.js
- Build: npm run build
- Start: npm run start:prod
- Environment variables: Set in Render dashboard
  - ANTHROPIC_API_KEY
  - REPLICATE_API_TOKEN
  - ELEVENLABS_API_KEY
  - DATABASE_URL (Supabase PostgreSQL)
  - REDIS_URL
  - JWT_SECRET
  - SENTRY_DSN (optional)

### Frontend Deployment (Vercel)
- Framework: Vite (React)
- Build: npm run build
- Output: dist/
- Environment: Set VITE_API_URL to production backend

## System Requirements

### Compute
- Backend: 512MB RAM minimum (1GB recommended)
- Queue processor: Runs on same instance
- Video processing: 2GB RAM for concurrent video jobs

### Storage
- Video temp directory: 10GB recommended (/tmp/storyforge-videos)
- Database: PostgreSQL (Supabase free tier adequate for MVP)
- Cache: Redis (Render free tier adequate)

### Bandwidth
- Estimate: ~50MB per video generated (images + audio + video)
```

**Acceptance Criteria:**
- ✅ Local setup steps clear
- ✅ Production deployment procedure documented
- ✅ All environment variables listed
- ✅ System requirements specified
- ✅ Troubleshooting common issues included

---

### PASO 4: Troubleshooting & Monitoring Guide
**File:** `TROUBLESHOOTING.md` (NEW)  
**Objective:** Common issues and debugging techniques

**Content Required:**
```markdown
# Troubleshooting Guide

## Common Issues

### 1. "Redis connection refused"
**Symptoms:** Job not being processed, queue stuck
**Cause:** Redis not running or wrong connection URL
**Fix:**
- Check Redis is running: redis-cli ping
- Verify REDIS_URL in .env.local
- Restart queue processor: npm run start:dev

### 2. "FFmpeg not found"
**Symptoms:** Video generation fails with "ENOENT: ffmpeg not found"
**Cause:** FFmpeg not installed on system
**Fix:**
- macOS: brew install ffmpeg
- Ubuntu: sudo apt-get install ffmpeg
- Windows: choco install ffmpeg
- Verify: ffmpeg -version

### 3. "Job stuck in processing"
**Symptoms:** Job status never changes from 'processing'
**Cause:** Long-running API call (Claude, Replicate, ElevenLabs)
**Fix:**
- Check network connectivity
- Verify API keys in .env.local
- Check rate limits on external API
- Timeout defaults: 5min for video, 2min for others

### 4. "429 Too Many Requests"
**Symptoms:** API returns "Rate limit exceeded"
**Cause:** Exceeded per-endpoint throttle limits
**Fix:**
- Wait 60 seconds for counter reset
- Increase RATE_LIMIT_* in .env
- Stagger requests if bulk processing

### 5. "Out of memory" (video processing)
**Symptoms:** Video generation fails with OOM error
**Cause:** Large images or concurrent video jobs
**Fix:**
- Reduce image resolution before video assembly
- Run single video job at a time
- Increase server RAM allocation
- Monitor with: node --max-old-space-size=2048 dist/main.js

## Debugging Techniques

### Enable Debug Logging
Set LOG_LEVEL=debug in .env.local

### Monitor Queue
```bash
# Check pending jobs
redis-cli llen bull:generation:waiting
redis-cli lrange bull:generation:waiting 0 -1
```

### Check Database
```bash
npm run prisma:studio
# Inspect Job table directly
```

### API Testing
```bash
# Test with curl
curl -X POST http://localhost:3000/generate/script \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"story":"test"}'
```

## Performance Monitoring

- Response times: GET /generate/job/:jobId should be <100ms
- Queue processing: Most jobs 1-5 minutes (depends on external APIs)
- Error rate: Monitor Sentry for exceptions
- Cost tracking: Log API calls per endpoint
```

**Acceptance Criteria:**
- ✅ 5+ common issues documented with fixes
- ✅ Debugging techniques provided
- ✅ Log level instructions clear
- ✅ Performance baselines noted
- ✅ Monitoring tools recommended

---

### PASO 5: Environment Variables Reference
**File:** `.env.production` (NEW)  
**Objective:** Production environment template with all required variables

**Content Required:**
```markdown
# Production Environment Configuration

# NODE ENVIRONMENT
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# DATABASE
DATABASE_URL=postgresql://...@aws-prod.supabase.co:5432/storyforge

# AUTHENTICATION
JWT_SECRET=<very-long-random-string>
JWT_EXPIRATION=24h

# EXTERNAL APIS
ANTHROPIC_API_KEY=sk-ant-v0-...
REPLICATE_API_TOKEN=r8_...
ELEVENLABS_API_KEY=sk_...

# QUEUE
REDIS_URL=redis://...render.com:...

# RATE LIMITING
RATE_LIMIT_SCRIPT=5
RATE_LIMIT_IMAGES=10
RATE_LIMIT_AUDIO=15
RATE_LIMIT_VIDEO=10
RATE_LIMIT_TTL_MS=60000

# VIDEO PROCESSING
VIDEO_OUTPUT_DIR=/tmp/storyforge-videos
FFMPEG_TIMEOUT_MS=300000

# MONITORING
SENTRY_DSN=https://...@sentry.io/...
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# CORS
CORS_ORIGIN=https://storyforge.app

# FRONTEND
VITE_API_URL=https://api.storyforge.app
```

**Acceptance Criteria:**
- ✅ All production variables documented
- ✅ Placeholder values clearly marked
- ✅ Security-sensitive vars noted
- ✅ Examples match actual deployment platform
- ✅ Comments explain each variable

---

### PASO 6: Handoff Notes for Next Developer
**File:** `HANDOFF_2_8.md` (NEW)  
**Objective:** Context for whoever continues development after MVP

**Content Required:**
```markdown
# Handoff Notes - MVP Complete (May 17, 2026)

## What's Done ✅

### Backend API (76% MVP Complete)
- ✅ NestJS server with 5 endpoints (script, images, audio, video, job status)
- ✅ 4 external APIs integrated (Claude, Replicate, ElevenLabs, FFmpeg)
- ✅ Async queue processor (Bull + Redis)
- ✅ Rate limiting on all endpoints
- ✅ JWT authentication
- ✅ Prisma ORM with Job tracking
- ✅ Full TypeScript strict mode
- ✅ npm build: EXIT CODE 0

### What's NOT Done ❌
- Frontend UI (React app exists but not integrated)
- Video delivery (stored locally, not in cloud storage)
- Payment system (Stripe not integrated)
- User profiles (auth exists, profiles not implemented)
- Email notifications (job complete alerts not sent)
- Metrics dashboard (monitoring UI not built)

## How to Continue

### Next Priority: Frontend Integration
1. Connect React frontend to backend API
2. Implement job polling UI (progress bars)
3. Add file upload for story text
4. Display generated video player
5. User account dashboard

### Before Production:
1. Set up cloud storage for videos (S3/GCS)
2. Configure email notifications
3. Implement payment processing
4. Add user profiles & history
5. Set up monitoring (Sentry + custom metrics)
6. Load testing (simulate concurrent users)

### Key Files to Know
- Backend: /backend/src/generate/ (main logic)
- Integrations: /backend/src/integrations/ (API wrappers)
- Database: /backend/prisma/schema.prisma
- Config: /backend/.env.local + .env.production
- Frontend: /frontend/src/ (React components)

### Important Gotchas
1. FFmpeg must be installed separately (not npm)
2. Redis connection required for queue processor
3. Rate limits are per-minute (60s window)
4. Video assembly requires both image + audio jobs first
5. Job status polling uses GET /job/:jobId (not websocket yet)

### Testing Strategy
- Unit tests: Not yet implemented (Jest configured)
- Integration tests: Manual cURL tests in TROUBLESHOOTING.md
- E2E tests: Use Playwright after frontend complete
- Load testing: Use Artillery tool after deployment

### Deployment Checklist
- [ ] All env vars set in production
- [ ] Database migrations applied
- [ ] Redis connection verified
- [ ] FFmpeg installed on server
- [ ] Sentry project created (optional)
- [ ] CORS configured for frontend domain
- [ ] Rate limits tuned for expected load
- [ ] Backup strategy for video files
- [ ] Monitoring alerts set up
- [ ] SSL certificate configured

## Code Quality Notes

### Patterns Established
- Async queue pattern used for all API calls (very reusable)
- DTO classes for input validation (class-validator)
- Service layer for business logic
- TypeScript strict mode enforced
- 3-retry exponential backoff for failed jobs

### Technical Debt
- Video files stored locally (should move to cloud)
- No caching layer (consider Redis for results)
- Job history unlimited (should implement pruning)
- Logging basic (could use Winston more extensively)
- No API versioning (add /api/v1 before scale)

### Next Optimizations
1. Add response caching (Redis)
2. Implement job webhooks (vs polling)
3. Add batch job processing
4. Compress video output
5. Use message queue for reliability

## Quick Start for Continuation

```bash
# Setup
git clone ...
cd storyforge
npm install (root)
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Configure
cp backend/.env.example backend/.env.local
# Edit .env.local with your API keys

# Run
npm run start:dev (from root - starts both)

# Test
curl -X POST http://localhost:3000/generate/script \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{"story":"..."}'
```

## Support & References

- Architecture: See ARCHITECTURE.md
- API docs: See API_ENDPOINTS.md
- Deployment: See DEPLOYMENT.md
- Troubleshooting: See TROUBLESHOOTING.md
- Code standards: See DEVELOPMENT_GUIDELINES.md (in /instructions)

## Last Known Status

- Build: ✅ EXIT CODE 0 (May 17, 02:00 UTC)
- Tests: ⏳ Not yet implemented
- Frontend: 🚧 Boilerplate only (not connected)
- Deployment: ⏳ Ready (not yet live)
- Rate limits: ✅ Active
- Queue processor: ✅ Running

---

**Created by:** Claude (Copilot)  
**Date:** May 17, 2026 02:00 UTC  
**MVP Status:** 76% Complete (Backend API finished, Frontend integration pending)
```

**Acceptance Criteria:**
- ✅ Clear summary of what's done vs not done
- ✅ Next priorities prioritized
- ✅ Quick start instructions provided
- ✅ Key files identified
- ✅ Gotchas and patterns documented
- ✅ Deployment checklist provided
- ✅ Previous work is usable by next dev

---

### PASO 7: Update Root README.md
**File:** `README.md` (MODIFY - add production section)  
**Objective:** Add production-ready sections to main README

**Changes:**
- Add "Production Ready" badge
- Add links to all documentation files created in PASOS 1-6
- Add quick deployment section
- Update MVP completion percentage
- Add architecture diagram reference

**Acceptance Criteria:**
- ✅ README clearly indicates MVP completion (76%)
- ✅ Links to all new documentation
- ✅ Quick start for local + production included
- ✅ Visual indicators of completion status

---

## 🎯 Deliverables Summary

By end of Task 2.8, the following files should exist:

```
StoryForge/
├── API_ENDPOINTS.md ← All endpoints documented with examples
├── ARCHITECTURE.md ← System design and data flow
├── DEPLOYMENT.md ← Production deployment guide
├── TROUBLESHOOTING.md ← Common issues and fixes
├── .env.production ← Production env template
├── HANDOFF_2_8.md ← Context for next developer
├── README.md ← UPDATED with links to docs
└── backend/
    ├── .env.local ← Verified working locally
    └── dist/ ← npm run build: EXIT CODE 0
```

---

## 📊 Acceptance Criteria (Overall Task 2.8)

- ✅ API_ENDPOINTS.md created with 5+ endpoints fully documented
- ✅ ARCHITECTURE.md explains async pattern, components, data flow
- ✅ DEPLOYMENT.md includes local + production setup (Render/Vercel compatible)
- ✅ TROUBLESHOOTING.md covers 5+ common issues with fixes
- ✅ .env.production template created with all variables
- ✅ HANDOFF_2_8.md provides next-dev context
- ✅ README.md updated with new documentation links
- ✅ All documents follow markdown best practices
- ✅ npm build still: EXIT CODE 0
- ✅ MVP status updated to 76% → 80%

---

## 📝 Implementation Notes

### Writing Style
- Clear, concise technical language
- Code examples actually executable
- Real errors/solutions (not generic)
- Step-by-step instructions numbered
- Common gotchas highlighted with ⚠️

### Cross-References
- Link between docs (e.g., API_ENDPOINTS → TROUBLESHOOTING)
- Back-references to code locations
- Link to ADO backlog for feature tracking

### Version Control
- Tag docs with "v1.0 - MVP" date
- Include date generated (May 17, 2026)
- Note any assumptions about deployment platform

---

## ⏱️ Estimated Time Breakdown

- API_ENDPOINTS.md: 30 min (examples, testing)
- ARCHITECTURE.md: 40 min (diagram, explanation)
- DEPLOYMENT.md: 50 min (step-by-step testing)
- TROUBLESHOOTING.md: 40 min (real issues collected)
- .env.production: 15 min (variable references)
- HANDOFF_2_8.md: 30 min (context capture)
- README.md updates: 15 min (linking)
- **Total: ~3.5 hours**

---

## 🚀 Next Steps After Task 2.8

**Week 3 (May 18-22) - Frontend Integration:**
- Connect React to backend API
- Implement job polling UI
- Add file upload & progress tracking
- Create user dashboard

**Week 4 (May 25-29) - Production:**
- Cloud storage setup
- Payment integration
- Load testing
- Live deployment
