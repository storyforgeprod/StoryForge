# CLAUDE.md

Guidance: Claude Code (claude.ai/code) working in this repository.

## 🚀 Project Overview

**StoryForge:** SaaS MVP converts long-form story text (webtoons, manhwas, web novels) → short-form narrated videos (YouTube Shorts, <5 min). AI-powered.

**Status:** MVP Implementation (Weeks 1-6)  
**Tech:** React + Vite + NestJS + Supabase + Claude + Replicate + ElevenLabs + FFmpeg  
**Launch:** Week 6 (staging ready for validation)

## 🔑 Azure DevOps

**Repo:**
```
https://dev.azure.com/ia-aplicada-grupo-04/StoryForge
```

**PAT Token:**
```
✅ Windows Credential Manager
✅ Workspace: ia-aplicada-grupo-04
✅ Project: StoryForge
```

**Backlog:**
- Épicas, Historias, Criterios de Aceptación ready in ADO
- Bidirectional sync: GitHub ↔ Azure DevOps
- Weekly burn-downs + velocity tracking

## 📚 Documentation

**Start:**
1. [QUICK_START.md](QUICK_START.md) — 10 min local setup
2. [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) — 6-week roadmap + tracking
3. [STACK_INIT.md](STACK_INIT.md) — Tech stack, versions, directory structure
4. [DEVELOPMENT_GUIDELINES.md](DEVELOPMENT_GUIDELINES.md) — Conventions, patterns, testing
5. [AZURE_DEVOPS_CONFIG.md](AZURE_DEVOPS_CONFIG.md) — ADO setup + backlog
6. [MCP_INTEGRATION.md](MCP_INTEGRATION.md) — Claude MCP integration for dev
7. [OPTIONAL_COMPONENTS.md](OPTIONAL_COMPONENTS.md) — Removable/modifiable components

**Reference:**
- `etapa4-brief-final.md` — Product Brief (JTBD, North Star Metric, exit criteria)
- `backlog-azure-devops.md` — 3 épicas, 9 historias, 66 story points

## 🎯 Custom Slash Commands (Legacy)

Located `.claude/commands/`. Available for future product discovery:

| Command | Role | Phase |
|---|---|---|
| `/product-analyst` | Research + validation | Pre-MVP ✅ |
| `/product-strategist` | Strategy + metrics | Pre-MVP ✅ |
| `/product-architect` | Technical planning | Pre-MVP ✅ |
| `/product-writer` | Documentation | Pre-MVP ✅ |
| `/product-pipeline` | Orchestrator | Pre-MVP ✅ |

**Status:** Discovery ✅ COMPLETE. Implementation now.

## 🤖 Development Mode

**MCP for Dev Acceleration:**
- Claude accesses: project structure, API schema, DB schema
- Auto test execution + validation
- Code generation following guidelines + ADO story refs
- Deploy automation Render

See [MCP_INTEGRATION.md](MCP_INTEGRATION.md).

---

## 🔄 Latest Status (May 19, 2026)

**Week 2 backend:** ✅ COMPLETE (Tasks 2.1–2.8)  
**Completed this phase:**
- ✅ Full async generation pipeline (Claude, Replicate, ElevenLabs, FFmpeg)
- ✅ Rate limiting + JWT auth + Prisma job tracking
- ✅ Task 2.8: API/deploy/troubleshooting documentation

**Current Progress:** ~87% MVP (story input done; 3.4 deferred)

**Quick Links for Continuation:**
- [NEXT_STEPS.md](NEXT_STEPS.md) — Task 3.6 (style selector) ⭐
- [instructions/TASK_3_5_COMPLETE.md](instructions/TASK_3_5_COMPLETE.md) — Story input
- [instructions/TASK_3_2_3_COMPLETE.md](instructions/TASK_3_2_3_COMPLETE.md) — Auth setup
- [instructions/HANDOFF_2_8.md](instructions/HANDOFF_2_8.md) — Detailed handoff
- [API_ENDPOINTS.md](API_ENDPOINTS.md) — API reference
- [PROGRESS.md](PROGRESS.md) — Weekly status
- [HANDOFF.md](HANDOFF.md) — Setup + context
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) — 6-week roadmap

**Governance Note:** All technical decisions must now respect STACK_INIT.md. Unauthorized changes = technical debt. Future developers MUST update PROGRESS.md + HANDOFF.md after each session. See IMPLEMENTATION_PLAN.md for mandatory developer guidelines.
