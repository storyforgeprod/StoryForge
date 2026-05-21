# Tasks: Voice Narration UI — Task 4.3

## Summary

Total tasks: 3 | Estimated effort: M (≤ 3h)

## Checklist

- [ ] TASK-4.3-01: Build `AudioPlayer` component
- [ ] TASK-4.3-02: Wire audio generation phase into `Generate.tsx`
- [ ] TASK-4.3-03: Unit tests for `AudioPlayer`

---

## Layer: Frontend — Component

### TASK-4.3-01: Build `AudioPlayer` component

**Layer:** Frontend — Component
**Size:** S
**Depends on:** none
**Description:** Create `frontend/src/components/AudioPlayer/AudioPlayer.tsx`. Renders a native `<audio controls>` element with `src` prop. Below the player, display duration if provided: "Duración estimada: Xs". Wrap in a `Card` for visual consistency with the rest of the wizard.
**Inputs:** shadcn/ui `Card`; native `<audio>` HTML element
**Output / Done when:** Component renders; audio plays in browser; duration text visible if prop provided.

---

## Layer: Frontend — Integration

### TASK-4.3-02: Wire audio generation phase into `Generate.tsx`

**Layer:** Frontend — Integration
**Size:** M
**Depends on:** TASK-4.3-01, Task 4.1, Task 4.2
**Description:** In `Generate.tsx`, after images phase done, transition `wizardPhase` to `'audio-idle'`. Render: (idle) "Generar narración" button; (loading) spinner + "Generando narración…" + disabled nav; (done) `AudioPlayer` with `audioUrl` and `audioLength` + "Continuar al video" CTA; (error) error message + "Reintentar" that calls `resetAudio()`. On "Generar narración" click, call `generateAudio(scriptJobId, voiceId)`.
**Inputs:** `useGenerateAudio` from Task 4.1; `AudioPlayer` from TASK-4.3-01; `scriptJobId` and `voiceId` from Generate.tsx state
**Output / Done when:** Full audio flow validated in browser with a real ElevenLabs request or a mock URL. `npm run build` EXIT 0.

---

## Layer: Testing

### TASK-4.3-03: Unit tests for `AudioPlayer`

**Layer:** Testing
**Size:** S
**Depends on:** TASK-4.3-01
**Description:** Vitest + RTL. Cover: renders `<audio>` with correct `src`; duration text visible when `durationSeconds` provided; no duration text when omitted.
**Inputs:** `AudioPlayer` component
**Output / Done when:** All tests pass.

---

## Task Dependency Map

```
TASK-4.1-03 → TASK-4.3-02
TASK-4.3-01 ────────────↗
TASK-4.2-02 ────────────↗
                ↓
          TASK-4.3-03
```
