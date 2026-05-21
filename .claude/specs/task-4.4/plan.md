# Technical Plan: Real-Time Pipeline Progress Indicator — Task 4.4

## High-Level Architecture

```
Generate.tsx
  ├── PipelineProgress  ← persistent header (always visible)
  │     └── stages: [script, images, audio, video]
  │           each with: StageStatus = 'pending' | 'active' | 'done' | 'error'
  └── main content area (wizard steps, loading states, etc.)
```

`PipelineProgress` is driven by a `stages` prop derived from the wizard phase in `Generate.tsx`. It has no internal state.

## Components Affected

| Component | Change Type | Notes |
|-----------|-------------|-------|
| `frontend/src/components/PipelineProgress/PipelineProgress.tsx` | New | Step indicator + progress bar |
| `frontend/src/pages/Generate.tsx` | Modified | Compute `stages` from `wizardPhase`; render `PipelineProgress` at top |

## Architecture Decision Records

### ADR-1: Derive stage states from `wizardPhase`, not from hook internals

- **Context:** Each generation hook has its own state. `PipelineProgress` needs a unified view.
- **Decision:** `Generate.tsx` maps `wizardPhase` to a `PipelineStage[]` array and passes it as a prop.
- **Rationale:** Keeps `PipelineProgress` a dumb display component; avoids prop drilling hook state into it.
- **Trade-offs:** Mapping logic lives in `Generate.tsx`; straightforward for 4 fixed stages.

### ADR-2: Horizontal step indicator, not a vertical sidebar

- **Context:** The app is mobile-first (9:16 video output); vertical space is precious.
- **Decision:** Compact horizontal step dots/icons with labels below on desktop, icons only on mobile.
- **Rationale:** Minimal vertical footprint; consistent with common mobile wizard patterns.
- **Trade-offs:** Labels may truncate on small screens.

### ADR-3: Per-stage progress bar only for the active stage

- **Context:** Backend `progress` is coarse (0/25/100); showing a bar for all stages would be misleading.
- **Decision:** Show a thin animated progress bar only for the active stage. Use a CSS animation for the polling phase to imply activity (indeterminate-style).
- **Rationale:** Communicates activity without implying false precision.
- **Trade-offs:** Users can't see exact percentage; acceptable given coarse backend values.

## Component API

```ts
// frontend/src/components/PipelineProgress/PipelineProgress.tsx

export type StageStatus = 'pending' | 'active' | 'done' | 'error';

export type PipelineStage = {
  id: 'script' | 'images' | 'audio' | 'video';
  label: string;
  status: StageStatus;
};

export type PipelineProgressProps = {
  stages: PipelineStage[];
};
```

## Generate.tsx — Stage Derivation

```ts
function deriveStages(phase: WizardPhase): PipelineStage[] {
  return [
    { id: 'script', label: 'Guión',    status: scriptStatus(phase) },
    { id: 'images', label: 'Imágenes', status: imagesStatus(phase) },
    { id: 'audio',  label: 'Audio',    status: audioStatus(phase)  },
    { id: 'video',  label: 'Video',    status: videoStatus(phase)  },
  ];
}
// status helpers map phase strings to StageStatus
```

## Security Considerations

- Pure display component; no auth or data concerns.

## Performance Considerations

- Rerenders only when `wizardPhase` changes; no internal timers.
- CSS animation on the active stage uses `animation: pulse` — no JS timer.
