# Tasks: Connect Frontend to /generate/video — Task 4.7

## Summary

Total tasks: 3 | Estimated effort: S (≤ 2h)

## Checklist

- [ ] TASK-4.7-01: Add video types and `postGenerateVideo` to service layer
- [ ] TASK-4.7-02: Build `useGenerateVideo` hook
- [ ] TASK-4.7-03: Unit tests for `useGenerateVideo`

---

## Layer: Frontend — Types + Service

### TASK-4.7-01: Add video types and `postGenerateVideo` to service layer

**Layer:** Frontend — Types + Service
**Size:** S
**Depends on:** Task 4.1 (generateApi.ts exists)
**Description:** (1) Add `VideoAssemblyResult` and `GenerateVideoState` types to `frontend/src/types/generate.ts`. (2) Add `postGenerateVideo({ imageJobId, audioJobId, fps?, bitrate? }, token)` to `generateApi.ts`, following the same pattern as `postGenerateImages`.
**Inputs:** plan.md types and API contract; `generate-video.dto.ts` backend shape
**Output / Done when:** Types and function exported; TypeScript compiles without errors.

---

## Layer: Frontend — Hook

### TASK-4.7-02: Build `useGenerateVideo` hook

**Layer:** Frontend — Hook
**Size:** S
**Depends on:** TASK-4.7-01
**Description:** Create `frontend/src/hooks/useGenerateVideo.ts`. State machine: idle → submitting → polling → completed | error. Timeout at 240 seconds (80 attempts × 3s). On `completed`, extract `videoUrl`, `duration`, `fileSize` from job result. Map 400 errors to "Las imágenes o el audio aún no están listos." Guard duplicate calls. Clean up interval on unmount.
**Inputs:** `generateApi.ts`; `useGenerateImages` as structural reference; error message map from plan.md
**Output / Done when:** Hook compiles; state machine transitions correctly; interval cleaned on unmount.

---

## Layer: Testing

### TASK-4.7-03: Unit tests for `useGenerateVideo`

**Layer:** Testing
**Size:** S
**Depends on:** TASK-4.7-02
**Description:** Vitest + `renderHook` + fake timers. Cover: happy path (idle → completed with `videoUrl`); 400 error → specific message; timeout after 80 attempts; `reset()` returns to idle; duplicate guard.
**Inputs:** `useGenerateVideo`; mocked `generateApi`
**Output / Done when:** All tests pass; covers AC-2 through AC-7.

---

## Task Dependency Map

```
TASK-4.1-01 → TASK-4.7-01 → TASK-4.7-02 → TASK-4.7-03
```
