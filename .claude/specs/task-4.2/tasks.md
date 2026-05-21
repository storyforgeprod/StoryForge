# Tasks: Image Generation UI — Task 4.2

## Summary

Total tasks: 3 | Estimated effort: M (≤ 4h)

## Checklist

- [x] TASK-4.2-01: Build `ImageGrid` component
- [x] TASK-4.2-02: Wire image generation phase into `Generate.tsx`
- [x] TASK-4.2-03: Unit tests for `ImageGrid`
- [x] TASK-4.2-04: Add `style` field to `GenerateImagesDto`
- [x] TASK-4.2-05: Propagate `style` to Replicate prompt in queue processor

---

## Layer: Frontend — Component

### TASK-4.2-01: Build `ImageGrid` component

**Layer:** Frontend — Component
**Size:** S
**Depends on:** none
**Description:** Create `frontend/src/components/ImageGrid/ImageGrid.tsx`. Renders a responsive grid: 1 column on mobile (`grid-cols-1`), 2 columns on `sm:` breakpoint (`sm:grid-cols-2`). Each cell is an `<img>` with `loading="lazy"`, `alt="Escena N"`, and `object-cover` aspect-ratio container (16:9 or 9:16 depending on video format). Accepts `imageUrls: string[]` prop.
**Inputs:** TailwindCSS grid utilities; shadcn/ui `Card` wrapper optional
**Output / Done when:** Grid renders any number of image URLs; responsive layout verified in browser at 375px and 1024px.

---

## Layer: Frontend — Integration

### TASK-4.2-02: Wire image generation phase into `Generate.tsx`

**Layer:** Frontend — Integration
**Size:** M
**Depends on:** TASK-4.2-01, Task 4.1
**Description:** In `Generate.tsx`, after script phase completes, transition `wizardPhase` to `'images-idle'`. Render: (idle) script summary + "Generar imágenes" button; (loading) spinner + "Generando imágenes…" label + disabled navigation; (done) `ImageGrid` + "Continuar al audio" button; (error) error message from `imagesState.message` + "Reintentar" button that calls `resetImages()` and returns to `images-idle`. Wire `useGenerateImages(token)` at the top of the component. On "Generar imágenes" click, call `generateImages(scriptJobId)`.
**Inputs:** `useGenerateImages` from Task 4.1; `ImageGrid` from TASK-4.2-01; `scriptJobId` from Task 3.8 state
**Output / Done when:** Full flow validated in browser: script done → images triggered → images displayed → Continue enabled. `npm run build` EXIT 0.

---

## Layer: Testing

### TASK-4.2-03: Unit tests for `ImageGrid`

**Layer:** Testing
**Size:** S
**Depends on:** TASK-4.2-01
**Description:** Vitest + RTL. Cover: renders correct number of `<img>` elements; each `<img>` has `loading="lazy"` attribute; empty array renders nothing without crashing; `alt` text follows "Escena N" pattern.
**Inputs:** `ImageGrid` component
**Output / Done when:** All tests pass; covers AC-3, AC-4.

---

---

## Layer: Backend — DTO + Queue Processor

### TASK-4.2-04: Add `style` field to `GenerateImagesDto`

**Layer:** Backend — DTO
**Size:** S
**Depends on:** none (can run in parallel with frontend tasks)
**Description:** Extend `backend/src/generate/dto/generate-images.dto.ts` with `style: StoryStyle` decorated with `@IsEnum(StoryStyle)` and `@IsNotEmpty()`. Import `StoryStyle` from `generate-script.dto.ts`. Update Swagger `@ApiProperty`. This makes `POST /generate/images` fail with HTTP 400 if `style` is not provided.
**Inputs:** `backend/src/generate/dto/generate-images.dto.ts`; `StoryStyle` enum from `generate-script.dto.ts`
**Output / Done when:** `npm run build` EXIT 0. `POST /generate/images` without `style` returns HTTP 400. Swagger shows `style` as required field.

---

### TASK-4.2-05: Propagate `style` to Replicate prompt in queue processor

**Layer:** Backend — Queue Processor
**Size:** S
**Depends on:** TASK-4.2-04
**Description:** In `generate.queue.processor.ts`, add `style` to the `GenerationJobData` interface. In `generate.service.ts` `generateImages()`, pass `style: dto.style` in the `queue.addGenerationJob()` call. In `generateImageContent()`, accept `style` in the data parameter and prepend it to the image prompt (e.g. `"anime style, dramatic lighting, scene: ..."`). Update `_buildImagePrompt()` to accept and use the style string.
**Inputs:** `generate.queue.processor.ts`; `generate.service.ts` `generateImages` and `generateImageContent` methods; `replicate.service.ts`
**Output / Done when:** A job submitted with `style: 'manga'` generates an image prompt containing "manga style". Verified via queue processor logs.

---

## Task Dependency Map

```
TASK-4.2-04 → TASK-4.2-05
                    ↓
TASK-4.1-03 → TASK-4.2-02
TASK-4.2-01 ────────────↗
                ↓
          TASK-4.2-03
```
