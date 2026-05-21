# Tasks: Connect Frontend to /generate/images and /generate/audio — Task 4.1

## Summary

Total tasks: 4 | Estimated effort: M (≤ 3h)

## Checklist

- [x] TASK-4.1-01: Add image and audio result types to `generate.ts`
- [x] TASK-4.1-02: Add `postGenerateImages` and `postGenerateAudio` to `generateApi.ts`
- [x] TASK-4.1-03: Build `useGenerateImages` and `useGenerateAudio` hooks
- [x] TASK-4.1-04: Unit tests for both new hooks

---

## Layer: Frontend — Types

### TASK-4.1-01: Add image and audio result types to `generate.ts`

**Layer:** Frontend — Types
**Size:** S
**Depends on:** TASK-3.6-01 (file exists)
**Description:** Add `ImageGenerationResult`, `AudioGenerationResult`, `GenerateImagesState`, `GenerateAudioState` types to `frontend/src/types/generate.ts`. Match shapes from backend `ImageGenerationResult` and `AudioGenerationResult` interfaces.
**Inputs:** `backend/src/generate/dto/generate-images.dto.ts`, `backend/src/generate/dto/generate-audio.dto.ts`
**Output / Done when:** Types exported; TypeScript compiles without errors.

---

## Layer: Frontend — Service

### TASK-4.1-02: Add `postGenerateImages` and `postGenerateAudio` to `generateApi.ts`

**Layer:** Frontend — Service
**Size:** S
**Depends on:** TASK-3.8-01 (file exists), TASK-4.1-01
**Description:** Add two typed async functions to `frontend/src/services/generateApi.ts`: `postGenerateImages({ scriptId, style, imageDescription? }, token)` and `postGenerateAudio({ scriptId, voiceId? }, token)`. Both inject `Authorization: Bearer <token>`, throw typed errors on non-2xx. Note: `style` is required in `postGenerateImages` once TASK-4.2-04 lands on the backend.
**Inputs:** API contracts from plan.md; existing `postGenerateScript` as pattern reference
**Output / Done when:** Functions exported; TypeScript compiles; throws on 400/401/429/5xx.

---

## Layer: Frontend — Hooks

### TASK-4.1-03: Build `useGenerateImages` and `useGenerateAudio` hooks

**Layer:** Frontend — Hooks
**Size:** M
**Depends on:** TASK-4.1-02
**Description:** Create `frontend/src/hooks/useGenerateImages.ts` and `frontend/src/hooks/useGenerateAudio.ts`. Both follow the identical state-machine pattern from `useGenerateScript` (idle → submitting → polling → completed | error). Images timeout at 90s (30 attempts × 3s); audio timeout at 30s (10 attempts × 3s). Reuse `getJobStatus` from `generateApi.ts`. Guard against duplicate `generate()` calls while in-flight. Clean up interval on unmount.
**Inputs:** `generateApi.ts`; `useGenerateScript` as structural reference; error message map from plan.md
**Output / Done when:** Both hooks compile; intervals clear on unmount (verified in dev strict mode); timeout messages correct per type.

---

## Layer: Testing

### TASK-4.1-04: Unit tests for both new hooks

**Layer:** Testing
**Size:** S
**Depends on:** TASK-4.1-03
**Description:** Vitest + `renderHook` + `vi.useFakeTimers`. For each hook: happy path (idle → polling → completed); timeout fires at correct iteration; job failed → error state; duplicate `generate()` ignored; `reset()` returns to idle. Mock `generateApi` module.
**Inputs:** Both hooks; mocked `generateApi`
**Output / Done when:** All tests pass; covers AC-3 through AC-8.

---

## Task Dependency Map

```
TASK-3.8-01 → TASK-4.1-02 → TASK-4.1-03 → TASK-4.1-04
TASK-4.1-01 ───────────────────────────↗
```
