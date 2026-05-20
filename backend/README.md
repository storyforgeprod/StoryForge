# StoryForge Backend API

NestJS-based REST API for converting stories into short-form video scripts using AI.

## 🚀 Quick Start

```bash
# Install dependencies
npm install --legacy-peer-deps

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Development server (with watch mode)
npm run start:dev

# Production build
npm run build
npm run start:prod
```

**API runs on:** `http://localhost:3000`  
**Swagger Docs:** `http://localhost:3000/api`

---

## 📁 Project Structure

```
src/
├── main.ts                 # NestJS bootstrap entry point
├── app.module.ts           # Root module with imports
├── common/
│   └── logger/             # Custom logging service
└── generate/               # Main feature module
    ├── generate.module.ts  # Module definition
    ├── generate.controller.ts  # HTTP endpoints
    ├── generate.service.ts     # Business logic (Claude integration)
    ├── replicate.service.ts    # Image generation (Replicate)
    ├── elevenlabs.service.ts   # Text-to-speech (ElevenLabs)
    ├── video.service.ts        # Video assembly (FFmpeg/Modal)
    └── dto/                    # Data Transfer Objects
        ├── generate-script.dto.ts
        └── generate.dto.ts

prisma/
└── schema.prisma           # Database schema (PostgreSQL via Supabase)

dist/                       # Compiled output (after npm run build)
```

---

## 🔌 API Endpoints

### POST `/generate/script`
Convert story text to video script using Claude AI

**Request:**
```json
{
  "story": "A hero embarks on an epic quest...",
  "style": "anime",
  "duration": 60
}
```

**Response:**
```json
{
  "script": "Scene 1: Establishing shot...",
  "jobId": "job_1234567890_abc",
  "status": "completed",
  "createdAt": "2026-05-16T10:30:00Z"
}
```

### POST `/generate/images` (TODO)
Generate scene images using Replicate (status: `202 Accepted`)

### POST `/generate/audio` (TODO)
Generate narration audio using ElevenLabs (status: `202 Accepted`)

### POST `/generate/video` (TODO)
Assemble images + audio into final video (status: `202 Accepted`)

---

## 🔧 Configuration

**Required environment variables** (in `.env.local`):

```
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# AI Services
ANTHROPIC_API_KEY=sk-ant-...
REPLICATE_API_TOKEN=...
ELEVENLABS_API_KEY=...

# Database (Supabase)
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...supabase.co
SUPABASE_SERVICE_ROLE_KEY=...

# Cache/Queue
REDIS_URL=redis://...

# Frontend CORS
CORS_ORIGIN=http://localhost:5173
```

See `.env.example` for full list of options.

---

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:cov

# Run E2E tests
npm run test:e2e
```

---

## 📊 Database

Using Prisma ORM with Supabase PostgreSQL backend.

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Open Prisma Studio (visual DB explorer)
npm run prisma:studio
```

Schema is in `prisma/schema.prisma` (currently empty, to be populated).

---

## 🔌 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@nestjs/core` | ^10.3 | NestJS framework |
| `@anthropic-ai/sdk` | ^0.30 | Claude AI API |
| `@prisma/client` | ^5.21 | Database ORM |
| `ioredis` | ^5.4 | Redis client |
| `bull` | ^4.14 | Job queue |
| `class-validator` | ^0.14 | DTO validation |
| `@nestjs/swagger` | ^7.3 | API documentation |

---

## ✅ Current Status (16-mayo)

- [x] NestJS scaffold complete
- [x] POST `/generate/script` endpoint implemented
- [x] Claude AI service integration (ready to test)
- [ ] Replicate image generation service (stub)
- [ ] ElevenLabs TTS service (stub)
- [ ] Video assembly service (stub)
- [ ] Supabase/Prisma integration (pending)
- [ ] Queue/job processing (pending)
- [ ] Full E2E testing (pending)

---

## 🚀 Next Steps (Semana 1.6-1.7)

1. **Test `/generate/script` endpoint** with real Claude API key
2. **Implement Prisma schema** (User, Project, Job models)
3. **Integrate Supabase** for authentication and storage
4. **Add job queue** for async processing
5. **Rate limiting** per user
6. **Error handling** + Sentry integration
7. **E2E tests** for all endpoints

---

## 📝 Notes

- This API is part of the StoryForge MVP (6-week timeline)
- All AI integrations are optional features (feature flags supported)
- Backend uses modular NestJS architecture for scalability
- CI/CD pipeline via Render (auto-deploy on push to main)

---

**For more info:** See [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) and [DEVELOPMENT_GUIDELINES.md](../DEVELOPMENT_GUIDELINES.md)
