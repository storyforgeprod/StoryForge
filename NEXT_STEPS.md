# NEXT STEPS — StoryForge MVP Implementation

**Last Updated:** 17 May 2026 02:00 UTC | **MVP Progress:** 76% (Task 2.7 ✅)

---

## 🎯 IMMEDIATE ACTION (NOW)

### Task 2.8: Documentation & Handoff

**Status:** ⏳ READY  
**Criticality:** ⭐⭐⭐ REQUIRED for MVP completion  
**Estimated Time:** 2-3 hours  
**Depends On:** ✅ Task 2.7 (Rate limiting) COMPLETED

**What:** Create comprehensive API documentation, deployment guide, and handoff notes for production launch.

---

## ✅ Just Completed: Task 2.7

### Task 2.7: Rate Limiting & API Security — COMPLETADA ✅

**Implemented:**
- ✅ ThrottlerGuard registered globally via APP_GUARD in app.module.ts
- ✅ @Throttle() decorators on all 4 POST endpoints
- ✅ Per-endpoint rate limits: script(5), images(10), audio(15), video(10) per minute
- ✅ Environment variables configured (.env.example + .env.local)
- ✅ Response codes updated: script endpoint now returns 202 (async)
- ✅ npm build EXIT CODE 0 (0 TypeScript errors)

**Protection Matrix:**
| Endpoint | Requests/min | Cost Protection |
|---|---|---|
| /script | 5 | $0.10+ per request (Claude) |
| /images | 10 | $0.01 per image (Replicate) |
| /audio | 15 | ~$0.01 per minute (ElevenLabs) |
| /video | 10 | CPU intensive (FFmpeg) |

**Files Modified:**
- backend/src/app.module.ts (added ThrottlerGuard provider)
- backend/src/generate/generate.controller.ts (added @Throttle decorators)
- backend/src/main.ts (removed manual guard registration)
- .env.example (new file with full config)
- backend/.env.local (added rate limit variables)

**Documentation Created:**
- [TASK_2_7_COMPLETE.md](TASK_2_7_COMPLETE.md) ← Full implementation details ⭐
- Updated [PROGRESS.md](PROGRESS.md) with Task 2.7 status

---

## 📚 Documentation Structure

**⭐ ALL task planning and session documentation is now in the `instructions/` folder:**

```
instructions/
├── 🎯 TASK DOCUMENTATION
│   ├── TASK_2_5_PLAN.md ← Full implementation guide (created this session) ⭐
│   ├── TASK_2_4_PLAN.md ← Replicate images pattern
│   ├── TASK_2_3_PLAN.md ← Bull queue architecture
│   └── ... (more tasks)
│
└── 📋 SESSION & REFERENCE
    ├── SESSION_COMPLETION_2026_05_17.md
    ├── SESSION_SUMMARY_2026_05_16.md
    ├── START_HERE.md
    └── EXECUTIVE_SUMMARY.md
```

**Root-level documentation (governance + planning):**
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) — Master plan + decision log
- [PROGRESS.md](PROGRESS.md) — Weekly status (updated ✅)
- [HANDOFF.md](HANDOFF.md) — Setup + context (updated ✅)
- [DEVELOPMENT_GUIDELINES.md](DEVELOPMENT_GUIDELINES.md) — Code standards
- [STACK_INIT.md](STACK_INIT.md) — Authorized tech stack

---

## 🚀 Task 2.6 Implementation (Estimated 4 hours)

### PASO 1: Create Queue Processor
**File:** `backend/src/generate/generate.queue.processor.ts`  
**Time:** 30 min  
**Template:** [instructions/TASK_2_3_RUN_NOW.md](instructions/TASK_2_3_RUN_NOW.md) — PASO 1

### PASO 2: Refactor GenerateService to Async Pattern
**File:** `backend/src/generate/generate.service.ts`  
**Time:** 1.5 h  
**Template:** [instructions/TASK_2_3_RUN_NOW.md](instructions/TASK_2_3_RUN_NOW.md) — PASO 2

### PASO 3-4: Update Module + Bootstrap
**Files:** `generate.module.ts`, `main.ts`  
**Time:** 20 min  
**Template:** [instructions/TASK_2_3_RUN_NOW.md](instructions/TASK_2_3_RUN_NOW.md) — PASO 3-4

### PASO 5: Verify Compilation
**Command:** `npm run build`  
**Expected:** ✅ EXIT CODE 0

### PASO 6: Local Testing
**Time:** 2 h  
**Checklist:** [instructions/TASK_2_3_PLAN.md](instructions/TASK_2_3_PLAN.md#-testing-checklist)

---

## ⏳ Week 2 Timeline (May 17-22)

| Date | Task | Duration | Status |
|------|------|----------|--------|
| **May 17** | Task 2.3 (Queue Processor) | 5 h | 🔄 IN PROGRESS |
| **May 18** | Task 2.4 (Images endpoint) | 5 h | ⏳ Next |
| **May 19** | Task 2.5 (Audio endpoint) | 4 h | ⏳ Next |
| **May 20** | Task 2.6 (Rate limiting + error handling) | 3 h | ⏳ Next |
| **May 21** | Task 2.7 (E2E testing) | 3 h | ⏳ Next |
| **May 22** | Buffer / Review | 2 h | ⏳ Next |

---

## 🔗 Critical Files for This Session

1. **[instructions/TASK_2_3_RUN_NOW.md](instructions/TASK_2_3_RUN_NOW.md)** ⭐ — Execute this to implement Task 2.3
2. **[instructions/TASK_2_3_PLAN.md](instructions/TASK_2_3_PLAN.md)** — Full architecture if you need details
3. **[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)** — Where to document your decisions
4. **[PROGRESS.md](PROGRESS.md)** — Update weekly status after Task 2.3 completes
5. **[DEVELOPMENT_GUIDELINES.md](DEVELOPMENT_GUIDELINES.md)** — Code standards while implementing

---

## ✅ What's Already Done

- ✅ Backend infrastructure (NestJS, Prisma, Supabase, Bull queue)
- ✅ Task 2.1: Job tracking with Prisma (✅ VERIFIED)
- ✅ Task 2.2: Structure validation (✅ npm build EXIT 0)
- ✅ Governance rules established (STACK_INIT.md mandatory)
- ✅ File reorganization (task docs moved to `instructions/`)
- ✅ All code templates for Task 2.3 ready

---

## 🎬 START NOW

```bash
# 1. Read the quick start guide
cat instructions/TASK_2_3_RUN_NOW.md

# 2. Follow PASO 1-6 sequentially as documented

# 3. After implementation, verify
npm run build  # Should EXIT 0

# 4. Update progress
# - Update PROGRESS.md with Task 2.3 completion
# - Update HANDOFF.md if needed
# - Document any decisions in IMPLEMENTATION_PLAN.md
```

---

## 🎯 Why Task 2.3 is Critical

Without async processor:
- ❌ Script generation blocks client (bad UX)
- ❌ No progress tracking for long operations
- ❌ Not scalable (can't handle multiple concurrent jobs)
- ❌ Blocks Tasks 2.4, 2.5, 2.6 (all images, audio, video require same pattern)

With processor:
- ✅ Immediate response (jobId returned instantly)
- ✅ Background execution (progress updates via polling)
- ✅ Scalable to 10+ concurrent jobs (via Redis queue)
- ✅ Foundation for all remaining generation tasks

---

## 📖 Reference Docs

For context on why we're doing this:
- See [instructions/TASK_2_3_PLAN.md](instructions/TASK_2_3_PLAN.md) — Full architecture + decision rationale
- See [instructions/SESSION_COMPLETION_2026_05_17.md](instructions/SESSION_COMPLETION_2026_05_17.md) — Why we chose async pattern
- See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) — How this fits into 6-week roadmap
