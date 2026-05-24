# CLAUDE.md

Guidance for Claude Code working in the StoryForge repository.

## Project

StoryForge: SaaS MVP that converts long-form story text (webtoons, manhwas, web novels) into short-form narrated videos (YouTube Shorts, <5 min). AI-powered.

**Stack:** React 18 + Vite 5 + TailwindCSS + shadcn/ui | NestJS + Prisma + Bull | Supabase (DB + Storage) | Azure OpenAI + Azure Foundry + ElevenLabs + FFmpeg

## Azure DevOps

- **Repo:** `https://dev.azure.com/ia-aplicada-grupo-04/StoryForge`
- **PAT:** Windows Credential Manager (workspace: ia-aplicada-grupo-04, project: StoryForge)
- **Backlog:** 3 epics, 9 user stories, 66 story points

## Architecture

    Frontend (React :5173) --fetch--> NestJS (:3000)
      GenerateController -> GenerateService -> Bull Queue -> QueueProcessor
        Azure OpenAI (script) | Azure Foundry (images) | ElevenLabs (audio) | FFmpeg (video)
      Prisma (Supabase PostgreSQL) + Redis (Bull queue)

**Async pattern:** POST /generate/{type} -> Job created (pending) -> 202 + jobId -> Queue processor runs -> Client polls GET /generate/job/:jobId

**Key paths:**
- Backend entry: `backend/src/generate/` (controller, service, queue processor, DTOs)
- Integrations: `backend/src/integrations/` (azure-openai, azure-foundry-image, elevenlabs, video)
- Auth: `backend/src/common/auth/` (JWT strategy + guards)
- Frontend: `frontend/src/` (pages, components, hooks, services, types)

## Environment

**Prerequisites:** Node.js 18+, PostgreSQL 14+ (Supabase), Redis 6+, FFmpeg 4+

**Run locally:**

    cd backend && npm install && npm run start:dev   # :3000
    cd frontend && npm install && npm run dev         # :5173

**Backend env vars** (backend/.env.local):
SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET, REDIS_URL, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_API_VERSION, AZURE_OPENAI_DEPLOYMENT_GPT41

**Frontend env vars** (frontend/.env.local):
VITE_API_URL

**Database setup:** `cd backend && npx prisma generate && npx prisma migrate dev`

## Auth Flow

Auth guard exists but controllers currently use hardcoded `dev-user`. No login/signup routes implemented yet. Frontend has no auth integration (Supabase SDK installed but unused).

## Skills (auto-activated)

| Skill | Activates on | Enforces |
|-------|-------------|----------|
| `storyforge-frontend` | Any .tsx, component/page/hook/form task | React patterns, Tailwind, typed props, custom hooks, 4-state UI, Vitest + RTL |
| `storyforge-backend` | Any endpoint/service/DTO/module task | NestJS architecture, DTOs + class-validator, guards, Logger, Jest |
| `sdd-spec-creator` | "create spec for this story" or pasting ADO story | Produces spec.md + plan.md + tasks.md with EARS criteria |
| `spec-runner` | "implement task X.X" or pointing at tasks.md | Implements tasks in order, marks [x] after build+test pass |

## Product Discovery Commands (completed phase)

The `/product-analyst`, `/product-strategist`, `/product-architect`, `/product-writer`, `/product-pipeline` commands in `.claude/commands/` were used for pre-MVP discovery. That phase is complete. They remain available for future product ideas.

## Documentation

- [docs/architecture.md](docs/architecture.md) -- System design, tech stack, env vars, deploy targets
- `docs/backlog-azure-devops.md` -- 3 epics, 9 stories, 66 story points

## Rules

- All technical decisions must respect the authorized stack in docs/architecture.md
- Update CLAUDE.md after each development session
- Specs live in `.claude/specs/<task-id>/`; completed specs archived in `.claude/specs/_done/`
- Never bypass auth guards or rate limiting
- Follow skill standards when they activate
