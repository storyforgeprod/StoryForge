# Technical Plan: Serverless Video Assembly — Task 4.6

## High-Level Architecture

```
generateVideoContent() [generate.service.ts]
  └── videoService.assembleVideo(imageUrls, audioUrl, metadata)
        └── strategy switch on VIDEO_ASSEMBLY_STRATEGY env var
              ├── 'local'      → Task 4.5 FFmpeg path
              └── 'serverless' → HTTP call to external assembly function
                                  └── function runs FFmpeg internally
                                  └── uploads to Supabase Storage
                                  └── returns signed URL
```

## Components Affected

| Component | Change Type | Notes |
|-----------|-------------|-------|
| `backend/src/generate/video.service.ts` | Modified | Strategy pattern around `assembleVideo` |
| `backend/src/generate/video-serverless.service.ts` | New | Serverless HTTP client |
| `.env.production` | Modified | Add `VIDEO_ASSEMBLY_STRATEGY` |

## Architecture Decision Records

### ADR-1: Strategy pattern via env var, not dependency injection

- **Context:** Two assembly strategies exist. We need to switch between them without changing application code.
- **Decision:** `assembleVideo` reads `process.env.VIDEO_ASSEMBLY_STRATEGY` and delegates to the appropriate private method.
- **Rationale:** Simple; no NestJS provider complexity; environment-driven.
- **Trade-offs:** Not unit-testable without mocking `process.env`. Acceptable for infrastructure code.

### ADR-2: Serverless function as a standalone HTTP service

- **Context:** Options are a co-located NestJS worker or a standalone function on Modal/Lambda.
- **Decision:** Plan for Modal Labs Python function (FFmpeg is a first-class dependency in Modal). The NestJS backend calls it via `fetch(MODAL_FUNCTION_URL, { method: 'POST', body: JSON.stringify({ imageUrls, audioUrl }) })`.
- **Rationale:** Modal has native FFmpeg support; Python `moviepy` or `subprocess.run(['ffmpeg', ...])` are well-documented. No infra to maintain.
- **Trade-offs:** Requires a Modal account; cold-start latency on first call.

### ADR-3: Same Supabase Storage upload path as Task 4.5

- **Context:** Whether local or serverless, the output must land in Supabase Storage.
- **Decision:** The serverless function uploads directly to Supabase Storage using `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` passed in the request body (or as env vars in the Modal function).
- **Rationale:** Consistent storage topology; same signed URL shape for the frontend.
- **Trade-offs:** `SUPABASE_SERVICE_KEY` must be a secret in the serverless environment.

## API Contract (Backend → Serverless Function)

```
POST {MODAL_FUNCTION_URL}/assemble

Request:
{
  "imageUrls": ["https://..."],
  "audioUrl": "https://...",
  "jobId": "uuid",
  "userId": "uuid",
  "fps": 30,
  "bitrate": "2000k"
}

Response 200:
{
  "signedUrl": "https://...supabase.co/storage/...",
  "duration": 45,
  "fileSize": 12345678
}

Response 4xx/5xx:
{ "error": "string" }
```

## Environment Variables

```env
VIDEO_ASSEMBLY_STRATEGY=local    # or 'serverless'
MODAL_FUNCTION_URL=https://...   # required if strategy=serverless
```

## Security Considerations

- `MODAL_FUNCTION_URL` should be kept secret; add to `OPTIONAL_COMPONENTS.md` as a removable feature.
- `SUPABASE_SERVICE_KEY` must be injected as a Modal secret, not passed in the request body.

## Performance Considerations

- Modal cold start: ~3–5s on first call; subsequent calls reuse the container.
- Timeout: set Modal function timeout to 3 minutes; backend request timeout to 4 minutes.

## Observability

- Log `[VideoService] using strategy: serverless` on each call.
- Log the Modal function response status and `duration` field.
