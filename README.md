# StoryForge

Convert long-form stories (webtoons, manhwas, web novels) into short-form narrated videos (YouTube Shorts, <5 min). AI-powered SaaS MVP.

## Stack

- **Frontend:** React 18 + Vite 5 + TailwindCSS + shadcn/ui + TypeScript
- **Backend:** NestJS + Prisma + Bull/Redis + Swagger
- **Database:** Supabase (PostgreSQL + Storage)
- **AI Services:** Azure OpenAI (script) + Azure Foundry (images) + ElevenLabs (audio) + FFmpeg (video)

## Getting Started

### Prerequisites

- Node.js 18+
- Git
- Docker (optional, for local Redis)

### Setup

```bash
git clone https://dev.azure.com/ia-aplicada-grupo-04/StoryForge
cd StoryForge

# Backend
cd backend
cp .env.example .env.local    # Fill in your API keys
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev             # http://localhost:3000

# Frontend (separate terminal)
cd frontend
cp .env.example .env.local    # Fill in API URL
npm install
npm run dev                   # http://localhost:5173
```

### Required Credentials

**Backend** (backend/.env.local):
- Supabase: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`
- AI: `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_API_VERSION`, `AZURE_OPENAI_DEPLOYMENT_GPT41`
- Queue: `REDIS_URL`
- Prisma: `DATABASE_URL`

**Frontend** (frontend/.env.local):
- `VITE_API_URL`

### Verify

```bash
# Swagger docs
open http://localhost:3000/api

# Frontend loads
open http://localhost:5173
```

## Architecture

```
Frontend (React :5173) --fetch--> NestJS (:3000)
  GenerateController -> GenerateService -> Bull Queue -> QueueProcessor
    Azure OpenAI (script) | Azure Foundry (images) | ElevenLabs (audio) | FFmpeg (video)
  Prisma (Supabase PostgreSQL) + Redis (Bull queue)
```

All generation endpoints follow an async pattern:
1. Client POSTs to `/generate/{type}`
2. Server creates Job (pending), enqueues to Bull, returns 202 + jobId
3. Queue processor picks up job, calls external API
4. Client polls `GET /generate/job/:jobId` for status and result

## Running Tests

```bash
# Backend
cd backend && npm run test

# Frontend
cd frontend && npm run test
```
