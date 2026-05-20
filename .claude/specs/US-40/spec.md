# Spec: Generar imágenes de cada escena según estilo de género — US-40

## User Story

**As a** creadora de contenido de recaps,  
**I want** elegir un estilo visual (anime / manga / webtoon / novel) antes de generar las imágenes,  
**So that** el video final sea coherente con el universo estético de la historia y no requiera edición adicional.

## Context

Una vez que el guión fue generado (US-39, `POST /generate/script`), el usuario debe poder seleccionar un estilo visual antes de disparar la generación de imágenes. El `StoryStyle` enum ya existe en el backend (`generate-script.dto.ts`) y es requerido por `POST /generate/script`. Esta historia cubre la experiencia del selector en el frontend y la correcta propagación del estilo al pipeline de imágenes.

## Acceptance Criteria

| ID | Criteria (EARS) |
|----|-----------------|
| AC-1 | When the user reaches Step 2 of the generation flow, the system shall display four style options: `anime`, `manga`, `webtoon`, and `novel`. |
| AC-2 | When the user selects a style, the system shall visually highlight the selected card and store the value in component state. |
| AC-3 | While no style is selected, the system shall keep the "Continuar" button disabled. |
| AC-4 | When the user selects a style and clicks "Continuar", the system shall pass the `style` value to the `POST /generate/script` payload. |
| AC-5 | When `POST /generate/images` is called, the system shall include the selected `style` in the request body as per `GenerateImagesDto`. |
| AC-6 | When image generation completes, the system shall display each generated image on screen before allowing the user to proceed to the audio step. |
| AC-7 | If an image generation job fails, the system shall display a clear error message and a "Reintentar" button; the user must trigger the retry manually. |
| AC-8 | The system shall generate all scene images within 60 seconds under normal load. |
| AC-9 | While images are being generated, the system shall display a loading indicator and disable navigation away from the current step. |

## Out of Scope

- Personalización del estilo por escena individual (todas las escenas comparten el mismo estilo).
- Preview de muestra por estilo antes de confirmar.
- Generación de imágenes sin guión previo.
- Upload de imágenes propias del usuario.

## Assumptions

- El guión ya fue generado exitosamente y su `jobId` está disponible en el estado del flujo.
- `GenerateImagesDto` será extendido con el campo `style: StoryStyle` (actualmente no lo tiene — ver Open Questions).
- El componente vive dentro de `Generate.tsx` como un paso condicional, no como una ruta nueva.
- shadcn/ui `Card` es el componente base para las opciones de estilo.

## Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | `GenerateImagesDto` no tiene campo `style`. ¿Se agrega o se hereda del `scriptId` en el backend? | Backend dev | ✅ Resuelto: agregar campo `style: StoryStyle` explícitamente al DTO. |
| 2 | ¿Los 4 estilos tienen iconos/ilustraciones de referencia o usamos solo texto + color? | Design | ✅ Resuelto: texto + emoji/icono + color de acento. Sin assets externos para MVP. |
| 3 | ¿El retry de imagen fallida es automático y silencioso, o el usuario lo activa manualmente? | PM | ✅ Resuelto: manual — mostrar error claro con botón "Reintentar". |

## Dependencies

- US-39 — Análisis narrativo (guión generado, `scriptId` disponible)
- `backend/src/generate/dto/generate-script.dto.ts` — enum `StoryStyle` (ya existe)
- `backend/src/generate/dto/generate-images.dto.ts` — requiere agregar campo `style`
- Task 3.5 — `StoryInput` completado (punto de entrada al flujo)
