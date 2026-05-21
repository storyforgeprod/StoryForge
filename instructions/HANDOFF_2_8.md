# Handoff Notes — Backend MVP Complete (19 May 2026)

**MVP backend progress:** ~80% (Week 2 backend pipeline done; frontend Week 3 next)  
**Build verified:** `npm run build` EXIT 0 (19 May 2026)

---

## What's done

### Backend API (Semana 2 — Tasks 2.1–2.8)

- NestJS server with 5 routes under `/generate/*`
- Four external integrations: Claude, Replicate, ElevenLabs, FFmpeg
- Async Bull queue + `GenerateQueueProcessor`
- Global rate limiting (`ThrottlerGuard` + per-route `@Throttle`)
- JWT auth via Supabase
- Prisma job tracking (`Job` model)
- TypeScript strict mode; Swagger at `/api`
- Documentation package (root): API, architecture, deploy, troubleshooting

### Key files

| Area | Path |
|------|------|
| API routes | `backend/src/generate/generate.controller.ts` |
| Business logic | `backend/src/generate/generate.service.ts` |
| Queue worker | `backend/src/generate/generate.queue.processor.ts` |
| Integrations | `backend/src/integrations/` |
| DB schema | `backend/prisma/schema.prisma` |
| Env template | `.env.example`, `.env.production` |

---

## What's NOT done

- Frontend connected to backend (React boilerplate only)
- Videos in cloud storage (local `VIDEO_OUTPUT_DIR` only)
- Stripe / payments
- User profile UI
- Email on job complete
- E2E automated tests (deferred to staging — Task 6.6)
- CI/CD to Render (Task 1.4)
- ADO backlog sync (manual — see `backlog-azure-devops.md`)

---

## Next priority: Week 3 — Frontend (IMPLEMENTATION_PLAN Fase 2)

1. Task **3.1** — React + Vite + Tailwind + shadcn/ui setup
2. Task **3.2** — Supabase Auth (Google OAuth) in frontend
3. Task **3.5–3.8** — Story input, style/voice selectors, connect to `POST /generate/script`
4. Implement job polling UI (`GET /generate/job/:jobId`)

Start: [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) Semana 3 · [QUICK_START.md](../QUICK_START.md)

---

## Gotchas

1. **FFmpeg** is a system dependency — not installed via npm.
2. **Redis** must run for queue processing; jobs stay `pending` without it.
3. **Clean `node_modules`** if build fails on Windows (see [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)).
4. **Video assembly** needs both completed `imageJobId` and `audioJobId`.
5. **Polling only** — no WebSockets yet.
6. **JWT** comes from Supabase Auth; all generate routes require Bearer token.

---

## Quick start (continuation)

```powershell
cd StoryForge\backend
npm install
cp ..\.env.example .env.local
# Edit .env.local with keys
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

Docs: [ARCHITECTURE.md](../ARCHITECTURE.md)

---

## Deployment checklist (before staging)

- [ ] Env vars in Render (see `.env.production`)
- [ ] `prisma migrate deploy` on production DB
- [ ] Redis reachable
- [ ] FFmpeg on server PATH
- [ ] CORS for frontend domain
- [ ] Smoke test full pipeline
- [ ] Move video output to Supabase Storage

---

## Azure DevOps

- Repo: https://dev.azure.com/ia-aplicada-grupo-04/StoryForge
- PAT: Windows Credential Manager (workspace `ia-aplicada-grupo-04`)
- Config: [AZURE_DEVOPS_CONFIG.md](../AZURE_DEVOPS_CONFIG.md)
- Close Week 2 tasks in ADO when merging (2.1–2.8)

---

**Previous session docs:** [TASK_2_7_COMPLETE.md](TASK_2_7_COMPLETE.md) · [TASK_2_8_PLAN.md](TASK_2_8_PLAN.md)
