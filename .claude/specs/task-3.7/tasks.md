# Tasks: Voice Selector — Task 3.7

## Summary

Total tasks: 4 | Estimated effort: S (< 2h)

## Checklist

- [x] TASK-3.7-01: Add `VoiceOption` type to `generate.ts`
- [x] TASK-3.7-02: Build `VoiceSelector` component
- [x] TASK-3.7-03: Wire `VoiceSelector` into `Generate.tsx` as step 3
- [x] TASK-3.7-04: Unit tests for `VoiceSelector`

---

## Layer: Frontend / UI

### TASK-3.7-01: Add `VoiceOption` type to `generate.ts`

**Layer:** Frontend — Types
**Size:** S
**Depends on:** TASK-3.6-01 (file already exists)
**Description:** Add `VoiceOption` type to `frontend/src/types/generate.ts`. Fields: `id` (string), `name` (string), `description` (string), `previewUrl` (string).
**Inputs:** plan.md type definition
**Output / Done when:** Type exported; TypeScript compiles without errors.

---

### TASK-3.7-02: Build `VoiceSelector` component

**Layer:** Frontend — Component
**Size:** S
**Depends on:** TASK-3.7-01
**Description:** Create `frontend/src/components/VoiceSelector/VoiceSelector.tsx`. Render a vertical list of voice cards. Each card: voice name, tone description, a Play/Pause button (HTML `<audio>` ref), and a select affordance. Controlled via `value` / `onChange`. Only one audio preview plays at a time — managed by `playingId` state inside `VoiceSelector`. Selected card gets `ring-2 ring-primary`. If `<audio>` `onError` fires, show an inline error without crashing.
**Inputs:** `VoiceSelectorProps` from plan.md; `VOICE_OPTIONS` static data from plan.md; shadcn/ui `Card` + `Button`
**Output / Done when:** ≥ 2 voice cards render; clicking Play plays preview and pauses others; selecting a card calls `onChange`; error state visible when audio fails; tab + enter works.

---

### TASK-3.7-03: Wire `VoiceSelector` into `Generate.tsx` as step 3

**Layer:** Frontend — Integration
**Size:** S
**Depends on:** TASK-3.7-02, TASK-3.6-03
**Description:** In `Generate.tsx`: add `voiceId` state (`string | null`). At step `'voice'` render `VoiceSelector`. The action button on this step is "Generar guión" (not "Continuar"). It calls `handleGenerateScript()` (Task 3.8 stub for now). Button disabled while `voiceId === null`.
**Inputs:** Existing `Generate.tsx` after Task 3.6; `VoiceSelector` from TASK-3.7-02; `style` state
**Output / Done when:** Steps 1 → 2 → 3 transition correctly; selecting a voice enables the submit button; `npm run build` EXIT 0.

---

### TASK-3.7-04: Unit tests for `VoiceSelector`

**Layer:** Testing
**Size:** S
**Depends on:** TASK-3.7-02
**Description:** Vitest + RTL tests. Cover: renders ≥ 2 voice cards (AC-1); clicking select calls `onChange` with correct `id` (AC-4); `aria-checked` reflects selection (AC-8); play button exists per card (AC-2); error state renders when `audio.onError` fires (AC-7).
**Inputs:** `VoiceSelector` component; RTL `render`, `fireEvent`
**Output / Done when:** All tests pass; covers AC-1, AC-2, AC-4, AC-7, AC-8.

---

## Task Dependency Map

```
TASK-3.6-01 → TASK-3.7-01 → TASK-3.7-02 → TASK-3.7-03
                                   ↓
                             TASK-3.7-04
```
