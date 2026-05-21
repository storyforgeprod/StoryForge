# Technical Plan: Connect Frontend to /generate/images and /generate/audio — Task 4.1

## High-Level Architecture

```
generateApi.ts  (extended)
  ├── postGenerateScript()   ← already exists (Task 3.8)
  ├── getJobStatus()         ← already exists (Task 3.8)
  ├── postGenerateImages()   ← NEW
  └── postGenerateAudio()    ← NEW

hooks/
  ├── useGenerateScript.ts   ← already exists (Task 3.8)
  ├── useGenerateImages.ts   ← NEW
  └── useGenerateAudio.ts    ← NEW
```

## Components Affected

| Component | Change Type | Notes |
|-----------|-------------|-------|
| `frontend/src/services/generateApi.ts` | Modified | Add `postGenerateImages`, `postGenerateAudio` |
| `frontend/src/hooks/useGenerateImages.ts` | New | POST images + polling |
| `frontend/src/hooks/useGenerateAudio.ts` | New | POST audio + polling |
| `frontend/src/types/generate.ts` | Modified | Add `ImageGenerationResult`, `AudioGenerationResult` types |

## Architecture Decision Records

### ADR-1: Separate hook files, shared `getJobStatus`

- **Context:** All three generation hooks (script, images, audio) share the same polling pattern against `GET /generate/job/:jobId`.
- **Decision:** Each hook is its own file; all import and reuse `getJobStatus` from `generateApi.ts`.
- **Rationale:** Avoids a generic hook abstraction that adds complexity before the pattern stabilizes.
- **Trade-offs:** Some boilerplate duplication across hooks; acceptable at 3 hooks.

### ADR-2: Different timeouts per job type

- **Context:** Replicate image generation can take up to 60s; ElevenLabs audio takes 5–15s.
- **Decision:** `useGenerateImages` timeout = 90s; `useGenerateAudio` timeout = 30s.
- **Rationale:** Matches the expected SLA per service; avoids false timeouts on slow image jobs.
- **Trade-offs:** Different constants per hook file; documented in the respective `const`.

## API Contracts

### POST /generate/images

**Request:**
```json
{ "scriptId": "uuid", "style": "anime | manga | webtoon | novel", "imageDescription": "optional string" }
```
**Headers:** `Authorization: Bearer <token>`

**Response 202:**
```json
{ "jobId": "uuid", "status": "pending", "message": "Image generation queued", "createdAt": "ISO" }
```

**Completed job result (via GET /generate/job/:jobId):**
```json
{
  "id": "uuid",
  "status": "completed",
  "progress": 100,
  "result": { "imageUrls": ["https://..."], "prompt": "...", "generatedAt": "ISO" }
}
```

---

### POST /generate/audio

**Request:**
```json
{ "scriptId": "uuid", "voiceId": "optional ElevenLabs voice ID" }
```
**Headers:** `Authorization: Bearer <token>`

**Response 202:**
```json
{ "jobId": "uuid", "status": "pending", "message": "Audio generation queued", "createdAt": "ISO" }
```

**Completed job result:**
```json
{
  "result": { "audioUrl": "https://...", "audioLength": 45, "textUsed": "first 100 chars...", "generatedAt": "ISO" }
}
```

## New Types

```ts
// frontend/src/types/generate.ts additions

export type ImageGenerationResult = {
  imageUrls: string[];
  prompt: string;
  generatedAt: string;
};

export type AudioGenerationResult = {
  audioUrl: string;
  audioLength: number;
  textUsed: string;
  generatedAt: string;
};

export type GenerateImagesState =
  | { phase: 'idle' }
  | { phase: 'submitting' }
  | { phase: 'polling'; jobId: string }
  | { phase: 'completed'; imageUrls: string[] }
  | { phase: 'error'; message: string };

export type GenerateAudioState =
  | { phase: 'idle' }
  | { phase: 'submitting' }
  | { phase: 'polling'; jobId: string }
  | { phase: 'completed'; audioUrl: string; audioLength: number }
  | { phase: 'error'; message: string };
```

## Hook APIs

```ts
// useGenerateImages
export function useGenerateImages(token: string): {
  state: GenerateImagesState;
  generate: (scriptId: string) => void;
  reset: () => void;
};

// useGenerateAudio
export function useGenerateAudio(token: string): {
  state: GenerateAudioState;
  generate: (scriptId: string, voiceId?: string) => void;
  reset: () => void;
};
```

## Error Message Map (shared with Task 3.8 pattern)

| Condition | User-facing message |
|-----------|---------------------|
| 429 | "Límite alcanzado. Intentá en un minuto." |
| 401 | "Tu sesión expiró. Volvé a iniciar sesión." |
| Network / 5xx | "Error de conexión. Revisá tu internet." |
| Images timeout (90s) | "La generación de imágenes tardó demasiado. Intentá de nuevo." |
| Audio timeout (30s) | "La generación de audio tardó demasiado. Intentá de nuevo." |
| Job failed | Backend `error` field (fallback: generic message) |

## Security Considerations

- JWT passed in header; never in URL params.
- `scriptId` is validated server-side to belong to the calling user.

## Performance Considerations

- Polling at 3s intervals; stop immediately on terminal state.
- `useEffect` cleanup cancels interval on unmount.
