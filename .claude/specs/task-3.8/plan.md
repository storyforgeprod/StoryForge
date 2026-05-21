# Technical Plan: Connect Frontend to POST /generate/script — Task 3.8

## High-Level Architecture

```
Generate.tsx
  └── handleGenerateScript()
        └── useGenerateScript hook
              ├── POST /generate/script  →  { jobId, status }
              └── poll GET /generate/job/:jobId
                    ├── status: pending/processing  → keep polling (3s interval)
                    ├── status: completed            → set script result
                    └── status: failed / timeout     → set error state

Generate.tsx renders:
  ├── step === 'voice'     → VoiceSelector + "Generar guión" button
  ├── status === 'loading' → GeneratingState (spinner + label)
  └── status === 'done'    → ScriptResult (script display + next step CTA)
```

## Components Affected

| Component | Change Type | Notes |
|-----------|-------------|-------|
| `frontend/src/hooks/useGenerateScript.ts` | New | Encapsulates POST + polling logic |
| `frontend/src/services/generateApi.ts` | New | Typed fetch wrappers for generate endpoints |
| `frontend/src/pages/Generate.tsx` | Modified | Call hook; render loading / result / error states |

## Architecture Decision Records

### ADR-1: Custom hook for POST + polling, not inline in the component

- **Context:** The generate-script flow has multiple async phases (submit → poll → result). Inlining in the component makes `Generate.tsx` hard to test and reason about.
- **Decision:** Extract to `useGenerateScript(story, style)` hook returning `{ status, script, error, generate, reset }`.
- **Rationale:** Keeps `Generate.tsx` declarative; hook is independently unit-testable; follows existing service-layer pattern.
- **Trade-offs:** One extra file, but complexity is justified.

### ADR-2: Polling with `setInterval` + cleanup on unmount

- **Context:** React does not have built-in polling. Options: `setInterval`, recursive `setTimeout`, React Query.
- **Decision:** `useEffect` with `setInterval` cleared on component unmount or terminal state.
- **Rationale:** No new dependencies; straightforward for 3s polling over ≤ 30 seconds. React Query would be over-engineered for MVP.
- **Trade-offs:** Manual cleanup required; less cache sophistication than React Query.

### ADR-3: Typed API service layer in `generateApi.ts`

- **Context:** The hook needs to call two endpoints (`POST /generate/script`, `GET /generate/job/:jobId`). Auth token must be injected.
- **Decision:** Create `frontend/src/services/generateApi.ts` with typed functions that accept a JWT token and return typed DTOs.
- **Rationale:** Keeps network concerns separate from hook logic; easy to mock in tests.
- **Trade-offs:** Extra file; worth it for testability.

### ADR-4: Max polling timeout of 5 minutes

- **Context:** The backend generates script within 30s per backlog AC, but network or AI provider delays can extend this.
- **Decision:** Poll for max 300 seconds (100 attempts × 3s). After timeout, surface an error with a retry option.
- **Rationale:** Avoids infinite polling; 5 min covers p99 latency with headroom.
- **Trade-offs:** User sees an error after 5 min even if the job later completes.

## API Contracts

### POST /generate/script

**Request:**
```json
{
  "story": "string (50–5000 chars)",
  "style": "anime | manga | webtoon | novel"
}
```
**Headers:** `Authorization: Bearer <supabase_access_token>`

**Response 202:**
```json
{
  "jobId": "string",
  "status": "pending",
  "createdAt": "ISO date"
}
```

**Error Responses:**
- `400` — validation error (story too short/long or invalid style)
- `401` — missing or expired JWT
- `429` — rate limit exceeded (5 requests/min per user)
- `5xx` — server error

---

### GET /generate/job/:jobId

**Headers:** `Authorization: Bearer <supabase_access_token>`

**Response 200:**
```json
{
  "jobId": "string",
  "status": "pending | processing | completed | failed",
  "script": "string | null",
  "message": "string | null",
  "createdAt": "ISO date"
}
```

## Hook API

```ts
// frontend/src/hooks/useGenerateScript.ts

type GenerateScriptState =
  | { phase: 'idle' }
  | { phase: 'submitting' }
  | { phase: 'polling'; jobId: string; attempts: number }
  | { phase: 'completed'; script: string }
  | { phase: 'error'; message: string };

type UseGenerateScriptReturn = {
  state: GenerateScriptState;
  generate: (story: string, style: StoryStyle) => void;
  reset: () => void;
};

export function useGenerateScript(token: string): UseGenerateScriptReturn;
```

## Service Layer

```ts
// frontend/src/services/generateApi.ts

export async function postGenerateScript(
  body: { story: string; style: StoryStyle },
  token: string,
): Promise<{ jobId: string; status: string; createdAt: string }>;

export async function getJobStatus(
  jobId: string,
  token: string,
): Promise<{ jobId: string; status: string; script?: string; message?: string }>;
```

## Error Message Map

| HTTP / condition | User-facing message |
|------------------|---------------------|
| 429 | "Límite alcanzado. Intentá en un minuto." |
| 401 | "Tu sesión expiró. Volvé a iniciar sesión." |
| 400 | "Revisá el texto o el estilo seleccionado." |
| Network / 5xx | "Error de conexión. Revisá tu internet." |
| Polling timeout | "La generación tardó demasiado. Intentá de nuevo." |
| Job failed | Backend `message` field (fallback: "No se pudo generar el guión.") |

## Security Considerations

- JWT from Supabase `session.access_token` — never stored in `localStorage` beyond what Supabase already does.
- No user-provided content is interpreted as HTML; script result displayed as plain text.
- Rate limit errors (429) surfaced with a specific, actionable message (not a generic error).

## Performance Considerations

- Polling at 3s intervals for max 100 iterations (300s). Stop immediately on terminal state.
- Cancel the interval in `useEffect` cleanup to prevent state updates on unmounted components.

## Observability

- Log `[generate-script] submit`, `[generate-script] polling attempt N`, `[generate-script] completed/failed` to browser console in development.
- PostHog `script_generated` + `script_generation_failed` events can be added in Task 5.6.
