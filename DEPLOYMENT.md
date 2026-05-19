# StoryForge — Deployment Guide

**Version:** 1.0 (MVP) · **Updated:** 19 May 2026

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 18+ (22 tested) | LTS recommended |
| PostgreSQL | 14+ | Supabase hosted OK |
| Redis | 6+ | Bull queue (Upstash/Render Redis) |
| FFmpeg | 4+ | Required for `/generate/video` |
| Git | 2.x | — |

---

## Local development

### 1. Clone and install

```bash
git clone https://dev.azure.com/ia-aplicada-grupo-04/StoryForge
cd StoryForge/backend
npm install
```

If `npm run build` fails with missing modules, run a clean install:

```bash
Remove-Item -Recurse -Force node_modules   # PowerShell
npm install
npm run build
```

### 2. Environment

```bash
cp ../.env.example .env.local
# Or: cp .env.example .env.local inside backend/
```

Edit `backend/.env.local` — see [.env.production](.env.production) for full variable list.

Minimum for script-only testing:

- `DATABASE_URL`
- `ANTHROPIC_API_KEY`
- `JWT_SECRET` / Supabase keys (for auth)
- `REDIS_HOST`, `REDIS_PORT`

### 3. Database

```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

### 4. Redis

```bash
# Docker (optional)
docker run -d -p 6379:6379 redis:7-alpine
```

### 5. FFmpeg (video endpoint)

```bash
# Windows (Chocolatey)
choco install ffmpeg

# macOS
brew install ffmpeg

# Ubuntu
sudo apt-get install ffmpeg
```

### 6. Run backend

```bash
npm run start:dev
```

- API: http://localhost:3000  
- Swagger: http://localhost:3000/api  

### 7. Frontend (optional)

```bash
cd ../frontend
cp .env.example .env.local
npm install
npm run dev
```

→ http://localhost:5173

Full setup: [QUICK_START.md](QUICK_START.md)

---

## Production deployment (Render)

### Backend service

| Setting | Value |
|---------|-------|
| Environment | Node |
| Build command | `cd backend && npm install && npm run build` |
| Start command | `cd backend && npm run start:prod` |
| Health check | `GET /api` (Swagger) |

**Required environment variables** (set in Render dashboard):

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...@db.supabase.co:5432/postgres
JWT_SECRET=<long-random-string>
SUPABASE_PROJECT_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
REPLICATE_API_TOKEN=r8_...
ELEVENLABS_API_KEY=sk_...
REDIS_HOST=...
REDIS_PORT=6379
REDIS_PASSWORD=...
CORS_ORIGIN=https://your-frontend.onrender.com
SENTRY_DSN=...
VIDEO_OUTPUT_DIR=/tmp/storyforge-videos
```

⚠️ **FFmpeg:** Install via Render native environment or Docker image that includes `ffmpeg` in PATH.

⚠️ **Ephemeral disk:** `/tmp` is cleared on restart — move to Supabase Storage before production launch.

### Frontend (Render Static or Vercel)

| Setting | Value |
|---------|-------|
| Build | `cd frontend && npm install && npm run build` |
| Output | `frontend/dist` |
| Env | `VITE_API_URL=https://your-api.onrender.com` |

---

## System requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Backend RAM | 512 MB | 1 GB |
| Video jobs | — | 2 GB if concurrent FFmpeg |
| Disk (videos) | 2 GB temp | 10 GB `VIDEO_OUTPUT_DIR` |
| Redis | 25 MB | Render/Upstash free tier OK for MVP |

---

## CI/CD (planned — Task 1.4)

- GitHub Actions → build + test
- Deploy to Render on merge to `develop`
- See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) Semana 1, task 1.4

---

## Post-deploy checklist

- [ ] All env vars set in hosting dashboard
- [ ] `prisma migrate deploy` run against production DB
- [ ] Redis reachable from backend
- [ ] `ffmpeg -version` works on server
- [ ] CORS allows frontend origin
- [ ] Rate limits tuned for expected traffic
- [ ] Sentry receiving errors (optional)
- [ ] Smoke test: script → poll → completed

---

**See also:** [.env.production](.env.production) · [TROUBLESHOOTING.md](TROUBLESHOOTING.md) · [API_ENDPOINTS.md](API_ENDPOINTS.md)
