# Spec: Image Generation UI — Task 4.2

## User Story

**As a** content creator,
**I want** to see the generated images for each scene after my script is ready,
**So that** I can confirm the visual style matches my story before proceeding to audio.

## Context

Task 4.2 implements the image generation step (step 4 of the pipeline wizard) in `Generate.tsx`. After the script is generated (Task 3.8), the user triggers image generation. The frontend calls `POST /generate/images` via `useGenerateImages` (Task 4.1), polls until complete, then displays all generated images. This corresponds to Historia de Usuario 1.2 from the backlog.

Backend note: `GenerateImagesDto` currently does NOT include a `style` field — the style set in step 2 is passed to `POST /generate/script` only. Adding `style` to the images DTO and propagating it to the Replicate prompt are backend tasks tracked in this spec (TASK-4.2-04 and TASK-4.2-05).

## Acceptance Criteria

| ID | Criteria (EARS format) |
|----|------------------------|
| AC-1 | When the script job is `completed`, the system shall show a "Generar imágenes" button that the user must click to start. |
| AC-2 | While images are being generated, the system shall display a loading indicator with a per-scene progress estimate where possible. |
| AC-3 | When image generation completes, the system shall display every generated image in a scrollable grid before allowing the user to proceed. |
| AC-4 | Each image shall be visible at full-width on mobile and in a 2-column grid on desktop. |
| AC-5 | If image generation fails, the system shall display a clear error message and a "Reintentar" button that retries from the images step (not from step 1). |
| AC-6 | The system shall complete image generation within 60 seconds under normal load (surfaced as a timeout if exceeded). |
| AC-7 | While images are loading, the system shall disable navigation to the next step. |
| AC-8 | After all images are displayed, the system shall enable a "Continuar al audio" button. |

## Out of Scope

- Per-scene image regeneration.
- Image editing or cropping.
- Displaying more than the images returned by the backend.
- Passing `style` to `POST /generate/images` (US-40 scope).

## Assumptions

- `scriptJobId` from Task 3.8 is available in `Generate.tsx` state.
- `useGenerateImages` from Task 4.1 is available.
- The backend returns `imageUrls[]` as publicly accessible URLs (Replicate CDN).
- Images are displayed using native `<img>` tags with `loading="lazy"`.

## Open Questions

| # | Question | Owner | Status | Decision |
|---|----------|-------|--------|----------|
| 1 | Should images be shown one per scene or all at once when the job completes? | Martin | Resolved | **All at once** — wait for the full job to complete, then render all images. Simpler polling logic. |
| 2 | Is a loading skeleton per image slot needed, or a single spinner for the whole job? | Martin | Resolved | **Single spinner** — one centered spinner for the whole job; consistent with the script loading step. |

## Dependencies

- Task 3.8 ✅ — `scriptJobId` in Generate.tsx state
- Task 4.1 — `useGenerateImages` hook
- `POST /generate/images` backend endpoint (implemented, stubs Replicate call)
