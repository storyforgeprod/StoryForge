# StoryForge — Troubleshooting Guide

**Version:** 1.0 (MVP) · **Updated:** 19 May 2026

---

## Build & setup

### `rimraf` / `minimatch` / `chokidar` module not found

**Symptoms:** `npm run build` fails with `ERR_MODULE_NOT_FOUND` or `Cannot find module './lib/nodefs-handler'`.

**Cause:** Corrupted or partial `node_modules` (common after interrupted installs).

**Fix:**

```powershell
cd backend
Remove-Item -Recurse -Force node_modules
npm install
npm run build
```

Expected: `nest build` completes with no errors.

---

### `rimraf` not recognized (Windows)

**Symptoms:** `prebuild` script fails before compile.

**Fix:** Run `npm install` in `backend/` so local `node_modules/.bin` is on PATH via npm scripts.

---

## Runtime

### Redis connection refused

**Symptoms:** Jobs stay `pending` forever; console shows Redis errors.

**Fix:**

1. Start Redis: `docker run -d -p 6379:6379 redis:7-alpine`
2. Verify `REDIS_HOST` / `REDIS_PORT` in `backend/.env.local`
3. Restart: `npm run start:dev`

---

### FFmpeg not found

**Symptoms:** Video job fails; error mentions `ffmpeg` or `ENOENT`.

**Fix:**

```bash
ffmpeg -version   # must succeed
```

Install per OS (see [DEPLOYMENT.md](DEPLOYMENT.md)).

---

### Job stuck in `processing`

**Symptoms:** Status never updates from `processing`.

**Possible causes:**

- External API timeout (Claude, Replicate, ElevenLabs)
- Invalid or missing API key
- Network/firewall blocking outbound HTTPS

**Fix:**

1. Check `ANTHROPIC_API_KEY`, `REPLICATE_API_TOKEN`, `ELEVENLABS_API_KEY`
2. Set `LOG_LEVEL=debug` in `.env.local`
3. Inspect backend logs during job run
4. Confirm job `error` field via `GET /generate/job/:id`

---

### 429 Too Many Requests

**Symptoms:** `ThrottlerException: Too Many Requests`.

**Fix:**

- Wait 60 seconds (TTL window)
- Reduce request frequency
- Adjust limits in `.env.local` (development only):

```env
RATE_LIMIT_SCRIPT=10
RATE_LIMIT_TTL_MS=60000
```

---

### 401 Unauthorized

**Symptoms:** All `/generate/*` return 401.

**Fix:**

1. Include header: `Authorization: Bearer <token>`
2. Token must be valid Supabase JWT (not expired)
3. Verify `SUPABASE_ANON_KEY` matches project used to sign token

---

### 400 on GET job — "Unauthorized access"

**Symptoms:** Job exists but another user's token is used.

**Fix:** Use the same user JWT that created the job (`job.userId` must match).

---

### Out of memory (video)

**Symptoms:** Node crashes during `/generate/video`.

**Fix:**

- Process one video at a time
- Increase Node heap: `node --max-old-space-size=2048 dist/main.js`
- Use smaller source images / lower bitrate

---

## Debugging tools

### Swagger

http://localhost:3000/api — interactive API docs (needs JWT in Authorize).

### Prisma Studio

```bash
cd backend
npx prisma studio
```

Inspect `Job` table directly.

### Redis queue (Bull)

```bash
redis-cli ping
redis-cli llen bull:generation:wait
```

### Enable verbose logging

```env
LOG_LEVEL=debug
NODE_ENV=development
```

---

## Performance baselines

| Operation | Typical duration |
|-----------|----------------|
| GET `/generate/job/:id` | < 100 ms |
| Script job (Claude) | 30–90 s |
| Images job | 1–3 min |
| Audio job | 30–60 s |
| Video job (FFmpeg) | 1–5 min |

---

## When to escalate

1. Repeated failures after key rotation and Redis restart
2. Database migration errors on deploy
3. Production-only issues → check Sentry + Render logs

---

**See also:** [API_ENDPOINTS.md](API_ENDPOINTS.md) · [DEPLOYMENT.md](DEPLOYMENT.md) · [QUICK_START.md](QUICK_START.md)
