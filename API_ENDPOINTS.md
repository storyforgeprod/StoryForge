# StoryForge API — Endpoints Reference

**Version:** 1.0 (MVP)  
**Base URL (local):** `http://localhost:3000`  
**Swagger UI:** `http://localhost:3000/api`  
**Auth:** Bearer JWT (Supabase) on all routes below

---

## Authentication

All `/generate/*` routes require:

```http
Authorization: Bearer <supabase_jwt_token>
```

Obtain the token from Supabase Auth (Google OAuth) in the frontend, or via Supabase client SDK.

---

## Pipeline Overview

```text
POST /generate/script   → jobId (script)
POST /generate/images   → jobId (images)   [requires completed script jobId]
POST /generate/audio    → jobId (audio)    [requires completed script jobId]
POST /generate/video    → jobId (video)    [requires completed image + audio jobIds]
GET  /generate/job/:id  → poll any job
```

---

## POST `/generate/script`

Generates a short-form video script from story text using Claude.

| Property | Value |
|----------|-------|
| **Rate limit** | 5 requests / minute |
| **HTTP status** | `202 Accepted` |
| **Queue type** | `script` |

### Request body (`GenerateScriptDto`)

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `story` | string | yes | 50–5000 characters |
| `style` | enum | yes | `anime`, `manga`, `webtoon`, `novel` |
| `duration` | number | no | 30–300 seconds (pacing hint) |

### Response (`GenerateScriptResponseDto`)

```json
{
  "jobId": "clx123abc",
  "status": "pending",
  "message": "Script generation queued",
  "createdAt": "2026-05-19T12:00:00.000Z"
}
```

### Example

```bash
curl -X POST http://localhost:3000/generate/script \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"story\":\"Once upon a time in a distant kingdom, a young hero discovered a hidden power that would change everything forever...\",\"style\":\"anime\",\"duration\":60}"
```

### Completed job `result` (poll via GET job)

```json
{
  "script": "Scene 1: Establishing shot..."
}
```

---

## POST `/generate/images`

Generates scene images from a completed script job (Replicate Flux).

| Property | Value |
|----------|-------|
| **Rate limit** | 10 requests / minute |
| **HTTP status** | `202 Accepted` |
| **Depends on** | Completed `script` job |

### Request body (`GenerateImagesDto`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `scriptId` | string | yes | Job ID from `/generate/script` |
| `imageDescription` | string | no | 10–500 chars, custom prompt override |

### Response

```json
{
  "jobId": "clx456def",
  "status": "pending",
  "message": "Image generation queued",
  "createdAt": "2026-05-19T12:01:00.000Z"
}
```

### Example

```bash
curl -X POST http://localhost:3000/generate/images \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"scriptId\":\"clx123abc\"}"
```

### Completed job `result`

```json
{
  "imageUrls": ["https://..."],
  "prompt": "A futuristic city at sunset...",
  "generatedAt": "2026-05-19T12:02:00.000Z"
}
```

---

## POST `/generate/audio`

Generates narration audio from a completed script job (ElevenLabs).

| Property | Value |
|----------|-------|
| **Rate limit** | 15 requests / minute |
| **HTTP status** | `202 Accepted` |
| **Depends on** | Completed `script` job |

### Request body (`GenerateAudioDto`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `scriptId` | string | yes | Job ID from `/generate/script` |
| `voiceId` | string | no | ElevenLabs voice ID (default: Sarah) |

### Response

```json
{
  "jobId": "clx789ghi",
  "status": "pending",
  "message": "Audio generation queued",
  "createdAt": "2026-05-19T12:03:00.000Z"
}
```

### Example

```bash
curl -X POST http://localhost:3000/generate/audio \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"scriptId\":\"clx123abc\",\"voiceId\":\"EXAVITQu4vr4xnSDxMaL\"}"
```

### Completed job `result`

```json
{
  "audioUrl": "https://...",
  "audioLength": 45,
  "textUsed": "Scene 1: ...",
  "generatedAt": "2026-05-19T12:04:00.000Z"
}
```

---

## POST `/generate/video`

Assembles final MP4 (1080×1920) from completed image and audio jobs (FFmpeg).

| Property | Value |
|----------|-------|
| **Rate limit** | 10 requests / minute |
| **HTTP status** | `202 Accepted` |
| **Depends on** | Completed `images` + `audio` jobs |

### Request body (`GenerateVideoDto`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `imageJobId` | string | yes | Job ID from `/generate/images` |
| `audioJobId` | string | yes | Job ID from `/generate/audio` |
| `fps` | number | no | Default: 30 |
| `bitrate` | string | no | Default: `2000k` |

### Response

```json
{
  "jobId": "clx000jkl",
  "status": "pending",
  "message": "Video assembly queued",
  "createdAt": "2026-05-19T12:05:00.000Z"
}
```

### Example

```bash
curl -X POST http://localhost:3000/generate/video \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"imageJobId\":\"clx456def\",\"audioJobId\":\"clx789ghi\",\"fps\":30}"
```

### Completed job `result`

```json
{
  "videoUrl": "/tmp/storyforge-videos/....mp4",
  "duration": 60,
  "fileSize": 5242880,
  "format": "mp4",
  "generatedAt": "2026-05-19T12:10:00.000Z"
}
```

---

## GET `/generate/job/:jobId`

Poll job status. No per-route throttle (global default may apply).

### Response

```json
{
  "id": "clx123abc",
  "status": "completed",
  "progress": 100,
  "result": { "script": "..." },
  "error": null,
  "completedAt": "2026-05-19T12:01:30.000Z",
  "processingTimeMs": 45000
}
```

### Status values

| Status | Meaning |
|--------|---------|
| `pending` | Queued, not started |
| `processing` | Worker running |
| `completed` | Success — `result` populated |
| `failed` | Error — see `error` field |

### Example

```bash
curl http://localhost:3000/generate/job/clx123abc \
  -H "Authorization: Bearer YOUR_JWT"
```

---

## Error responses

| HTTP | Cause |
|------|-------|
| `400` | Validation error, empty story, unauthorized job access |
| `401` | Missing or invalid JWT |
| `404` | Job not found |
| `429` | Rate limit exceeded (wait 60s) |

Rate limit response example:

```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

---

## Rate limiting matrix

| Endpoint | Limit / min | Primary cost |
|----------|-------------|--------------|
| `/generate/script` | 5 | Claude API |
| `/generate/images` | 10 | Replicate |
| `/generate/audio` | 15 | ElevenLabs |
| `/generate/video` | 10 | FFmpeg CPU |

Configure via `.env.local`: `RATE_LIMIT_SCRIPT`, `RATE_LIMIT_IMAGES`, etc. (see `.env.example`).

---

**See also:** [ARCHITECTURE.md](ARCHITECTURE.md) · [TROUBLESHOOTING.md](TROUBLESHOOTING.md) · [DEPLOYMENT.md](DEPLOYMENT.md)
