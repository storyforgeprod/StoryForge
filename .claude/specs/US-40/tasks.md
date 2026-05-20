# Tasks: Generar imágenes según estilo de género — US-40

## Summary

Total tasks: 7 | Estimated effort: 8 SP | Orden: Backend DTO → Frontend componente → Integración → Tests

---

## Layer: Backend

### TASK-001: Agregar campo `style` a `GenerateImagesDto`
**Layer:** Backend  
**Size:** S  
**Depends on:** none  
**Description:** Extender `GenerateImagesDto` con `style: StoryStyle` usando `@IsEnum(StoryStyle)` y `@IsNotEmpty()`. Importar `StoryStyle` desde `generate-script.dto.ts`. Actualizar Swagger `@ApiProperty`.  
**Inputs:** `backend/src/generate/dto/generate-images.dto.ts`, `backend/src/generate/dto/generate-script.dto.ts`  
**Output / Done when:** `npm run build` EXIT 0. `POST /generate/images` sin `style` retorna HTTP 400.

---

### TASK-002: Propagar `style` al prompt de Replicate en el queue processor
**Layer:** Backend  
**Size:** S  
**Depends on:** TASK-001  
**Description:** En `generate.queue.processor.ts`, leer `style` del payload del job de imágenes y pasarlo a `ReplicateService` para incluirlo en el prompt (ej: `"anime style, dramatic lighting, scene: ..."`).  
**Inputs:** `backend/src/generate/generate.queue.processor.ts`, `backend/src/integrations/replicate.service.ts`  
**Output / Done when:** Un job de imágenes con `style: 'manga'` genera un prompt que contiene "manga style".

---

## Layer: Frontend — Componente

### TASK-003: Crear `StyleSelector` component
**Layer:** Frontend  
**Size:** M  
**Depends on:** none (puede hacerse en paralelo con TASK-001)  
**Description:** Crear `frontend/src/components/Style/StyleSelector.tsx`. Renderiza 4 cards (anime / manga / webtoon / novel) usando `shadcn/ui Card`. La card seleccionada recibe un borde highlight (`ring-2 ring-primary`). Props: `value: StoryStyle | null`, `onChange: (style: StoryStyle) => void`.  
**Inputs:** `frontend/src/components/ui/card.tsx`, enum `StoryStyle` (definir en `frontend/src/types/story.ts`)  
**Output / Done when:** Componente renderiza 4 cards. Click en una la selecciona visualmente. Solo una puede estar activa a la vez. `npm run build` EXIT 0.

---

### TASK-004: Definir `StoryStyle` en el frontend
**Layer:** Frontend  
**Size:** S  
**Depends on:** none  
**Description:** Crear `frontend/src/types/story.ts` con el enum `StoryStyle` (`anime | manga | webtoon | novel`) alineado al backend. Usarlo en `StyleSelector` y en el hook de generación.  
**Inputs:** `backend/src/generate/dto/generate-script.dto.ts` (referencia)  
**Output / Done when:** Archivo existe, se importa sin errores en `StyleSelector.tsx` y `Generate.tsx`.

---

### TASK-005: Integrar `StyleSelector` en `Generate.tsx` como Step 2
**Layer:** Frontend  
**Size:** M  
**Depends on:** TASK-003, TASK-004  
**Description:** En `Generate.tsx`, agregar estado `style: StoryStyle | null`. Mostrar `StyleSelector` después de que el usuario haga click en "Continuar" del Step 1 (StoryInput válido). El botón "Continuar" del Step 2 permanece deshabilitado mientras `style === null`. Pasar `style` al payload de `POST /generate/script`.  
**Inputs:** `frontend/src/pages/Generate.tsx`, `StyleSelector.tsx`  
**Output / Done when:** Flujo Step 1 → Step 2 funciona. "Continuar" en Step 2 deshabilitado sin selección. Con selección, habilita y avanza. Validado en navegador.

---

## Layer: Frontend — Integración API

### TASK-006: Crear hook `useGenerateImages`
**Layer:** Frontend  
**Size:** M  
**Depends on:** TASK-004  
**Description:** Crear `frontend/src/hooks/useGenerateImages.ts`. Llama `POST /generate/images` con `{ scriptId, style }`. Luego pollea `GET /generate/job/:jobId` cada 3 segundos hasta `status === 'completed'` o `'failed'`. Retorna `{ imageUrls, status, error, isLoading }`. Timeout de 90 segundos con mensaje de error amigable.  
**Inputs:** Plan.md API contracts, `frontend/src/services/api.ts` (si existe) o Axios directo  
**Output / Done when:** Hook retorna `imageUrls[]` al completar. Retorna error descriptivo si falla o supera timeout.

---

## Layer: Testing

### TASK-007: Tests unitarios para `StyleSelector`
**Layer:** Testing  
**Size:** S  
**Depends on:** TASK-003  
**Description:** Tests con Vitest + React Testing Library. Casos: (1) renderiza 4 opciones, (2) click selecciona visualmente la card correcta, (3) solo una card activa a la vez, (4) `onChange` se llama con el valor correcto.  
**Inputs:** `frontend/src/components/Style/StyleSelector.tsx`  
**Output / Done when:** 4 tests pasan. `npm run test` EXIT 0.

---

## Task Dependency Map

```
TASK-004 ──────────────────────────────────────────┐
   │                                               │
TASK-001 → TASK-002                          TASK-003
                                                   │
                                             TASK-005 → (Step 2 completo)
                                                   │
TASK-004 → TASK-006 ───────────────────────────────┘
               │
           (polling hook listo para Task 3.8)

TASK-003 → TASK-007
```

## ADO Task Names (para crear en US-40)

| Task | Nombre en ADO |
|------|---------------|
| TASK-001 | `[BE] Add style field to GenerateImagesDto` |
| TASK-002 | `[BE] Propagate style to Replicate prompt in queue processor` |
| TASK-003 | `[FE] Create StyleSelector component` |
| TASK-004 | `[FE] Define StoryStyle enum in frontend types` |
| TASK-005 | `[FE] Integrate StyleSelector as Step 2 in Generate.tsx` |
| TASK-006 | `[FE] Create useGenerateImages polling hook` |
| TASK-007 | `[TEST] Unit tests for StyleSelector` |
