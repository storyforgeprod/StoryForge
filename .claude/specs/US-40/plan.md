# Technical Plan: Generar imágenes según estilo de género — US-40

## High-Level Architecture

```mermaid
graph LR
  Generate["Generate.tsx\n(Step 2: estilo)"] -->|style: StoryStyle| State["Local state\nstory + style"]
  State -->|POST /generate/script\n{story, style}| ScriptEndpoint["NestJS\nGenerateController"]
  ScriptEndpoint --> ScriptJob["Job: script\n(Bull Queue)"]
  ScriptJob -->|scriptId| State
  State -->|POST /generate/images\n{scriptId, style}| ImagesEndpoint["NestJS\nGenerateController"]
  ImagesEndpoint --> ImagesJob["Job: images\n(Bull Queue)"]
  ImagesJob --> Replicate["Replicate API\n(Flux)"]
  Replicate -->|imageUrls[]| ImagesJob
  ImagesJob -->|GET /generate/job/:id| Polling["Frontend polling\nhook"]
  Polling -->|imageUrls[]| Generate
```

## Components Affected

| Component | Change Type | Notes |
|-----------|-------------|-------|
| `frontend/src/pages/Generate.tsx` | Modified | Agregar Step 2 con `StyleSelector`, gestionar estado `style` |
| `frontend/src/components/Style/StyleSelector.tsx` | New | Componente de 4 cards de estilo |
| `frontend/src/types/story.ts` | New | Re-exportar / definir `StoryStyle` en frontend |
| `frontend/src/hooks/useGenerateImages.ts` | New | Hook para llamar y pollear `POST /generate/images` |
| `backend/src/generate/dto/generate-images.dto.ts` | Modified | Agregar campo `style: StoryStyle` |

## Architecture Decision Records

### ADR-1: El selector de estilo vive en `Generate.tsx` como estado local, no en contexto global

- **Context:** El flujo Texto → Estilo → Voz → Generar es un wizard de una sola pantalla (no rutas separadas).
- **Decision:** Manejar `style` en el estado local de `Generate.tsx` junto a `story`, `voice`, etc.
- **Rationale:** Evita overhead de contexto/Zustand para estado efímero de sesión. El estado se resetea al completar o abandonar el flujo, que es el comportamiento esperado.
- **Trade-offs:** Si el flujo crece a rutas separadas en el futuro, habrá que migrar a contexto o query params.

### ADR-2: `style` se pasa tanto a `/generate/script` como a `/generate/images`

- **Context:** El prompt de Claude para el guión puede usar el estilo para adaptar el tono narrativo. Replicate necesita el estilo para el prompt de imagen.
- **Decision:** Incluir `style` en ambos DTOs.
- **Rationale:** Mantiene coherencia end-to-end. El backend ya lo requiere en `GenerateScriptDto`.
- **Trade-offs:** El usuario no puede cambiar el estilo entre guión e imágenes (aceptable para MVP).

### ADR-3: Polling en frontend para estado de generación de imágenes

- **Context:** La generación es async (Bull Queue). No hay WebSockets en el MVP.
- **Decision:** Hook `useGenerateImages` que llama `GET /generate/job/:jobId` cada 3 segundos hasta `completed` o `failed`.
- **Rationale:** Consistente con el patrón ya implementado en el backend. Mínimo cambio de arquitectura.
- **Trade-offs:** Latencia de hasta 3s en detectar completado; aceptable dado que las imágenes tardan 10-60s.

## Data Model Changes

No se requieren migraciones de base de datos. El modelo `Job` ya almacena `type: 'images'` y el campo `result` (JSON) contendrá `imageUrls[]`.

**Cambio en DTO únicamente:**

```typescript
// backend/src/generate/dto/generate-images.dto.ts — agregar:
import { StoryStyle } from './generate-script.dto';

export class GenerateImagesDto {
  @IsString() @IsNotEmpty()
  scriptId: string = '';

  @IsEnum(StoryStyle)
  @IsNotEmpty()
  style!: StoryStyle;

  @IsOptional() @IsString() @Length(10, 500)
  imageDescription?: string;
}
```

## API Contracts

### POST /generate/images

**Request:**
```json
{
  "scriptId": "uuid-script-job-12345",
  "style": "anime",
  "imageDescription": "optional override"
}
```

**Response 202:**
```json
{
  "jobId": "uuid-images-job-67890",
  "status": "pending",
  "message": "Image generation queued",
  "createdAt": "2026-05-20T10:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request` — `scriptId` vacío o `style` no válido
- `401 Unauthorized` — JWT ausente o expirado
- `429 Too Many Requests` — rate limit (10/min por usuario)

### GET /generate/job/:jobId

**Response 200 (completed):**
```json
{
  "jobId": "uuid-images-job-67890",
  "status": "completed",
  "progress": 100,
  "result": {
    "imageUrls": ["https://...scene1.png", "https://...scene2.png"],
    "prompt": "anime style, dramatic lighting...",
    "generatedAt": "2026-05-20T10:00:45Z"
  }
}
```

## Security Considerations

- Auth: `JwtAuthGuard` ya aplicado en `GenerateController`. Sin cambios.
- Input validation: `style` validado con `@IsEnum(StoryStyle)` en el DTO — rechaza valores arbitrarios.
- `scriptId` debe pertenecer al usuario autenticado (verificación en `generateImages` del service).

## Performance Considerations

- Generación de imágenes: 10–60s por job (Replicate). El polling cada 3s es aceptable.
- Rate limit existente: 10 requests/min por usuario para `/generate/images`.
- No se requiere caché de imágenes en el MVP (las URLs de Replicate son temporales).

## Observability

- Log existente en `generate.queue.processor.ts` cubre el job lifecycle.
- Agregar log en frontend si polling supera 90s sin completar (timeout warning al usuario).
