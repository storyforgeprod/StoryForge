# Tasks: Connect Frontend to POST /generate/script — Task 3.8

## Summary

Total tasks: 5 | Estimated effort: M (≤ 2h)

## Checklist

- [ ] TASK-3.8-01: Create `generateApi.ts` service
- [ ] TASK-3.8-02: Build `useGenerateScript` hook
- [ ] TASK-3.8-03: Render loading, result, and error states in `Generate.tsx`
- [ ] TASK-3.8-04: Unit tests for `useGenerateScript` hook
- [ ] TASK-3.8-05: Unit tests for `generateApi.ts`

---

## Layer: Frontend — Service

### TASK-3.8-01: Create `generateApi.ts` service

**Layer:** Frontend — Service
**Size:** S
**Depends on:** none
**Description:** Create `frontend/src/services/generateApi.ts`. Export two typed async functions: `postGenerateScript({ story, style }, token)` and `getJobStatus(jobId, token)`. Both inject `Authorization: Bearer <token>` header. On non-2xx response, throw a typed error object `{ status: number, message: string }` so the hook can map it to user-facing messages.
**Inputs:** API contracts from plan.md; `StoryStyle` type from `frontend/src/types/generate.ts`
**Output / Done when:** Functions exist with correct TypeScript signatures; throws on non-2xx; TypeScript compiles without errors.

---

## Layer: Frontend — Hook

### TASK-3.8-02: Build `useGenerateScript` hook

**Layer:** Frontend — Hook
**Size:** M
**Depends on:** TASK-3.8-01
**Description:** Create `frontend/src/hooks/useGenerateScript.ts`. Implement the state machine from plan.md (`idle → submitting → polling → completed | error`). On `generate()` call: set phase to `submitting`, call `postGenerateScript`, then enter `polling` phase. Poll `getJobStatus` every 3 seconds via `setInterval` inside a `useEffect`. Stop on `completed`, `failed`, or after 100 attempts (timeout). Map API error codes to user-facing messages using the error map in plan.md. Export `{ state, generate, reset }`.
**Inputs:** `generateApi.ts` from TASK-3.8-01; error message map from plan.md
**Output / Done when:** Hook transitions through all phases correctly; interval is cleared on unmount (verified by strict-mode double-invoke in development); TypeScript compiles.

---

## Layer: Frontend / UI

### TASK-3.8-03: Render loading, result, and error states in `Generate.tsx`

**Layer:** Frontend — Integration
**Size:** S
**Depends on:** TASK-3.8-02, TASK-3.7-03
**Description:** In `Generate.tsx`: call `useGenerateScript(token)` where `token` comes from `AuthContext`. Wire the "Generar guión" button to `generate(story, style)`. Render three new visual states: (1) `phase === 'submitting' | 'polling'` → full-card loading state with spinner and label "Analizando tu historia…"; (2) `phase === 'completed'` → script display area (scrollable `<pre>` or card) with a "Continuar" CTA (stub for Task 4.x); (3) `phase === 'error'` → error message + "Reintentar" button that calls `reset()` and returns to step 1. Disable the submit button while `phase !== 'idle'`.
**Inputs:** `useGenerateScript` hook; `AuthContext`; existing `Generate.tsx` after Tasks 3.6 + 3.7
**Output / Done when:** Full wizard flow works end-to-end in a local dev environment; all three result states render; `npm run build` EXIT 0.

---

## Layer: Testing

### TASK-3.8-04: Unit tests for `useGenerateScript` hook

**Layer:** Testing
**Size:** M
**Depends on:** TASK-3.8-02
**Description:** Vitest tests using `renderHook` + `vi.useFakeTimers`. Mock `generateApi` module. Cover: happy path (idle → polling → completed with script); rate-limit error (429 → error state with correct message); network error (throw → error state); polling timeout after 100 attempts; `reset()` returns to idle state; interval cleared after terminal state.
**Inputs:** `useGenerateScript`; mocked `generateApi`; fake timers
**Output / Done when:** All tests pass; covers AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9.

---

### TASK-3.8-05: Unit tests for `generateApi.ts`

**Layer:** Testing
**Size:** S
**Depends on:** TASK-3.8-01
**Description:** Vitest tests using `vi.stubGlobal('fetch', ...)`. Cover: `postGenerateScript` sends correct method, URL, headers, and body; throws typed error on 400, 401, 429, 500; `getJobStatus` sends correct `Authorization` header; throws on non-200.
**Inputs:** `generateApi.ts`; mocked `fetch`
**Output / Done when:** All tests pass; no real network calls in tests.

---

## Task Dependency Map

```
TASK-3.8-01 → TASK-3.8-02 → TASK-3.8-03
                    ↓
              TASK-3.8-04
TASK-3.8-01 → TASK-3.8-05
```
