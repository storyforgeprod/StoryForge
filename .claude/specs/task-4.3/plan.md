# Technical Plan: Voice Narration UI — Task 4.3

## High-Level Architecture

```
Generate.tsx
  └── wizardPhase === 'audio-*'
        ├── [audio-idle]    → "Generar narración" button
        ├── [audio-loading] → spinner + "Generando narración…"
        ├── [audio-done]    → AudioPlayer + duration + "Continuar al video" CTA
        └── [audio-error]   → error + "Reintentar"
```

## Components Affected

| Component | Change Type | Notes |
|-----------|-------------|-------|
| `frontend/src/components/AudioPlayer/AudioPlayer.tsx` | New | HTML5 audio player wrapper |
| `frontend/src/pages/Generate.tsx` | Modified | Add audio wizard phases; wire `useGenerateAudio` |

## Architecture Decision Records

### ADR-1: Native HTML5 `<audio controls>` with a thin wrapper

- **Context:** The player needs play, pause, and a scrubber. No custom styling required for MVP.
- **Decision:** Wrap `<audio controls>` in an `AudioPlayer` component that accepts `src` and `durationSeconds`. Display duration as formatted text below the player.
- **Rationale:** Zero dependencies; native accessibility; fully functional for MVP.
- **Trade-offs:** Browser-default controls look vary per OS. Post-MVP can be replaced with a custom player.

### ADR-2: `voiceId` passed from `Generate.tsx` state

- **Context:** The user selected a voice in Task 3.7; the selection is stored in `Generate.tsx` state.
- **Decision:** Pass `voiceId` directly to `generateAudio(scriptId, voiceId)`.
- **Rationale:** No need to re-surface the voice selector at this step.
- **Trade-offs:** User cannot change voice at step 5 without going back.

## Component API

```ts
// frontend/src/components/AudioPlayer/AudioPlayer.tsx
export type AudioPlayerProps = {
  src: string;
  durationSeconds?: number;
  className?: string;
};
```

## Generate.tsx Phase Extension

```ts
// New wizard phases
type PipelinePhase =
  | 'images-idle' | 'images-loading' | 'images-done' | 'images-error'
  | 'audio-idle'  | 'audio-loading'  | 'audio-done'  | 'audio-error';

// useGenerateAudio wired in Generate.tsx
const { state: audioState, generate: generateAudio, reset: resetAudio } =
  useGenerateAudio(token);
```

## Security Considerations

- `scriptId` belongs to the user — validated server-side.
- `voiceId` is constrained to the static list from Task 3.7.
- Audio URL is from a trusted origin (Supabase Storage or ElevenLabs CDN).
