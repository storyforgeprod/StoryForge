# Technical Plan: Connect Frontend to /generate/video — Task 4.7

## High-Level Architecture

```
generateApi.ts  (extended)
  └── postGenerateVideo()    ← NEW

hooks/
  └── useGenerateVideo.ts    ← NEW
```

## Components Affected

| Component | Change Type | Notes |
|-----------|-------------|-------|
| `frontend/src/services/generateApi.ts` | Modified | Add `postGenerateVideo` |
| `frontend/src/hooks/useGenerateVideo.ts` | New | POST video + 4-minute polling |
| `frontend/src/types/generate.ts` | Modified | Add `VideoAssemblyResult`, `GenerateVideoState` |

## New Types

```ts
// frontend/src/types/generate.ts additions

export type VideoAssemblyResult = {
  videoUrl: string;
  duration: number;      // seconds
  fileSize: number;      // bytes
  format: string;        // 'mp4'
  generatedAt: string;
};

export type GenerateVideoState =
  | { phase: 'idle' }
  | { phase: 'submitting' }
  | { phase: 'polling'; jobId: string }
  | { phase: 'completed'; videoUrl: string; duration: number; fileSize: number }
  | { phase: 'error'; message: string };
```

## Hook API

```ts
export function useGenerateVideo(token: string): {
  state: GenerateVideoState;
  generate: (imageJobId: string, audioJobId: string, opts?: { fps?: number; bitrate?: string }) => void;
  reset: () => void;
};
```

## API Contract

### POST /generate/video

**Request:**
```json
{ "imageJobId": "uuid", "audioJobId": "uuid", "fps": 30, "bitrate": "2000k" }
```
**Headers:** `Authorization: Bearer <token>`

**Response 202:**
```json
{ "jobId": "uuid", "status": "pending", "message": "Video assembly queued", "createdAt": "ISO" }
```

**Completed job result (GET /generate/job/:jobId):**
```json
{
  "result": {
    "videoUrl": "https://...supabase.co/storage/...",
    "duration": 45,
    "fileSize": 12000000,
    "format": "mp4",
    "generatedAt": "ISO"
  }
}
```

## Error Message Map

| Condition | User-facing message |
|-----------|---------------------|
| 400 (image/audio not ready) | "Las imágenes o el audio aún no están listos." |
| 429 | "Límite alcanzado. Intentá en un minuto." |
| Network / 5xx | "Error de conexión. Revisá tu internet." |
| Timeout (240s) | "El ensamblado tardó demasiado. Intentá de nuevo." |
| Job failed | Backend `error` field |
