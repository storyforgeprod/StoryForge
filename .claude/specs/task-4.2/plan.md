# Technical Plan: Image Generation UI — Task 4.2

## High-Level Architecture

```
Generate.tsx
  └── wizardPhase === 'images'
        ├── [idle]     → "Generar imágenes" button
        ├── [loading]  → ImageGeneratingState (spinner + label)
        ├── [done]     → ImageGrid + "Continuar al audio" CTA
        └── [error]    → error message + "Reintentar" button
```

## Components Affected

| Component | Change Type | Notes |
|-----------|-------------|-------|
| `frontend/src/components/ImageGrid/ImageGrid.tsx` | New | Responsive grid of generated images |
| `frontend/src/pages/Generate.tsx` | Modified | Add `images` wizard phase; wire `useGenerateImages` |

## Architecture Decision Records

### ADR-1: `wizardPhase` as the single orchestration signal

- **Context:** `Generate.tsx` already manages `step` (`story | style | voice`) from Tasks 3.6–3.8. Post-submission, the pipeline moves through `script | images | audio | video` phases.
- **Decision:** Rename/extend the state to `wizardPhase: WizardStep | PipelinePhase` so one value drives the entire rendered view.
- **Rationale:** Single source of truth; no competing boolean flags.
- **Trade-offs:** Enum grows; still manageable for MVP.

### ADR-2: Trigger images manually (user clicks button)

- **Context:** Images could auto-start after script completes. But showing the script result first lets the user confirm before spending Replicate credits.
- **Decision:** User sees the script + a "Generar imágenes" CTA. Images do not auto-start.
- **Rationale:** Avoids wasted credits if the script is bad; aligns with backlog AC that shows images before proceeding.
- **Trade-offs:** One extra click.

### ADR-3: `ImageGrid` as dumb display component

- **Context:** The image list comes from `useGenerateImages.state.imageUrls`.
- **Decision:** `ImageGrid` receives `imageUrls: string[]` and renders them. No state, no logic.
- **Rationale:** Follows the same controlled pattern as `StyleSelector` and `VoiceSelector`.
- **Trade-offs:** None.

## Component API

```ts
// frontend/src/components/ImageGrid/ImageGrid.tsx
export type ImageGridProps = {
  imageUrls: string[];
  className?: string;
};
```

## Generate.tsx Phase Extension

```ts
type PipelinePhase = 'images-idle' | 'images-loading' | 'images-done' | 'images-error';

// After script completes (Task 3.8), wizardPhase transitions to 'images-idle'
// useGenerateImages called in Generate.tsx
const { state: imagesState, generate: generateImages, reset: resetImages } =
  useGenerateImages(token);
```

## Security Considerations

- Image URLs are Replicate CDN public URLs — no auth needed to display.
- `scriptId` validated server-side to belong to the calling user.

## Performance Considerations

- Images rendered with `loading="lazy"` to avoid blocking the page.
- No client-side caching needed; URLs are ephemeral (Replicate CDN).
