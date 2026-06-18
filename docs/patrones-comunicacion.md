# Patrones de Comunicación - StoryForge

## 1. Patrón Asincrónico: Fire & Poll

Todas las operaciones de generación (script, imágenes, audio, video) siguen este patrón:

```
Frontend                          Backend
   |                                |
   |-- POST /generate/{type} ------>|
   |                                |
   |                           1. Crear Job (pending)
   |                           2. Enqueuer en Bull Queue
   |                           3. Responder 202 + jobId
   |<-- HTTP 202 + jobId ----------|
   |                                |
   |  [job se procesa asincronamente en background]
   |                                |
   |-- GET /generate/job/:jobId --->|
   |<-- 202 (aún pending) ---------|
   |                                |
   |-- GET /generate/job/:jobId --->|
   |<-- 200 + resultado ------------|
   |                                |
```

**Beneficios:**
- No bloquea el frontend (requests rápidas)
- Cliente decide la frecuencia de polling
- Evita timeouts en requests largos
- Escalable: múltiples jobs simultáneos

---

## 2. Job Lifecycle

Cada job (script, images, audio, video) tiene este ciclo de vida:

```
pending → processing → completed
                    ↘
                      failed
```

### Estados Detallados

| Estado | Significado | Acción |
|--------|------------|--------|
| `pending` | En cola, aún no procesado | Polling cada 2-5s |
| `processing` | Queue processor en ejecución | Polling continuo |
| `completed` | Éxito, resultado disponible | Mostrar resultado |
| `failed` | Error durante procesamiento | Mostrar error, reintentar |

### Ejemplo: GET /generate/job/:jobId

```json
{
  "id": "job_abc123",
  "status": "completed",
  "progress": 100,
  "result": {
    "script": "Scene 1: ...",
    "imageUrls": ["https://..."],
    "audioUrl": "https://...",
    "videoUrl": "https://..."
  },
  "error": null,
  "completedAt": "2026-06-15T10:30:00Z",
  "processingTimeMs": 45000
}
```

---

## 3. Flujo de Datos Entre Pasos

### Script Job → Images Job
```
Script Job Result
├─ metadata.story          (original)
├─ metadata.targetDuration (restricción)
├─ metadata.targetScenes   (restricción)
└─ result                  (script con escenas)
                ↓
        Image Generation
        ├─ Extrae escenas del script
        ├─ Genera prompt para cada escena
        ├─ Respeta metadata.style
        └─ Crea image job
```

### Images Job → Audio Job
```
Script Job (referenciado por metadata)
├─ result: script actual
└─ metadata
   ├─ story              (IMPORTANTE para narración)
   ├─ targetDuration     (restricción de duración)
   └─ language           (idioma)
                ↓
        Audio Generation
        ├─ Lée el STORY original (no el script)
        ├─ OpenAI genera narración profesional
        ├─ Respeta targetDuration + sceneCount
        └─ TTS convierte a audio
```

### Images + Audio Job → Video Job
```
Image Job Result
├─ imageUrls[]    ← Imágenes indexadas
└─ prompt         ← Prompts usados

Audio Job Result
├─ audioUrl       ← Audio final
└─ audioLength    ← Duración exacta en segundos
                ↓
        Video Assembly
        ├─ Sincroniza imágenes con duración de audio
        ├─ Calcula tiempo por imagen
        ├─ FFmpeg ensambla video
        └─ Sube a Supabase Storage
```

---

## 4. Rate Limiting

Cada endpoint tiene límites para evitar abuso:

```
POST /generate/script   → 5 requests / 60 segundos
POST /generate/images   → 10 requests / 60 segundos
POST /generate/audio    → 15 requests / 60 segundos
POST /generate/video    → 10 requests / 60 segundos
```

Frontend debe esperar entre requests o manejo de errores 429 (Too Many Requests).

---

## 5. Error Handling

### En el API (sincrónico)
```typescript
POST /generate/script
400 Bad Request
├─ Story vacio
├─ Duration fuera de rango (30-120s)
└─ Scenes fuera de rango (1-12)

401 Unauthorized
├─ No JWT token
└─ Token inválido/expirado

429 Too Many Requests
└─ Rate limit excedido
```

### En Queue Processor (asincrónico)
Si falla durante procesamiento:
```
1. Job.status = "failed"
2. Job.error = "Mensaje de error"
3. Job.completedAt = ahora
4. Cliente ve GET /job/:jobId → 200 + error
```

Errores comunes:
- Azure OpenAI rate limit → reintentar automático
- Image generation timeout → fallar job
- TTS provider down → fallback a Azure Speech
- FFmpeg OOM → reducir escenas (MAX_SCENES = 12)

---

## 6. Validaciones de Dependencias

### Pre-requisitos para cada paso

```
generateImages()
├─ scriptId debe existir
├─ scriptId debe pertenecer al usuario
└─ script job debe estar completed

generateAudio()
├─ scriptId debe existir
├─ scriptId debe pertenecer al usuario
└─ script job DEBE estar completed

generateVideo()
├─ imageJobId debe estar completed
├─ audioJobId debe estar completed
└─ Ambos deben pertenecer al usuario
```

Si falta algún pre-requisito → `BadRequestException` inmediato en el API.

---

## 7. Autenticación & Autorización

```
Todos los endpoints usan: @UseGuards(OptionalJwtAuthGuard)

JWT Token
├─ Proporcionado por @CurrentUser() decorator
├─ Claim principal: user.sub (userId)
└─ 7 días de expiración

Autenticación:
├─ POST /auth/register  → email + password
├─ POST /auth/login     → email + password
├─ GET /auth/google     → OAuth redirect
└─ POST /auth/refresh   → token expirado

Jobs:
├─ Usuario puede VER solo sus propios jobs
├─ Validación: job.userId === user.sub
└─ Si no coinciden: ForbiddenException
```

---

## 8. Caché de Voces

El servicio cachea la disponibilidad de voces para evitar síntesis repetidas:

```typescript
checkVoiceAvailability(voiceId, language)
├─ Primer check: Test con síntesis mínima (".")
├─ Cachea resultado 5 min (éxito) o 2 min (error)
└─ Checks posteriores: Devuelve resultado cacheado

Ventaja: Evita pruebas costosas (TTS es caro)
Desventaja: 2-5 min de latencia si voice "vuelve vivo"
```

---

## 9. Metadatos Persistentes

Los jobs almacenan datos importantes en `metadata` JSON:

```json
{
  "script_job": {
    "title": "Mi Historia",
    "story": "Texto original largo",
    "targetDuration": 60,
    "targetScenes": 12,
    "tone": "dramatic",
    "language": "es"
  },
  "image_job": {
    "scriptId": "job_xyz",
    "style": "manga_ink"
  },
  "audio_job": {
    "scriptId": "job_xyz",
    "language": "es"
  },
  "video_job": {
    "imageJobId": "job_abc",
    "audioJobId": "job_def"
  }
}
```

Este metadata se usa para:
- Audio narration (necesita story original)
- Video assembly (necesita IDs de dependencias)
- Auditoría y debugging

---

## 10. Diagrama de Eventos

```mermaid
graph LR
    A["User POST /script"] --> B["Job pending"]
    B --> C["Queue processing"]
    C --> D["Job completed"]
    D --> E["User POST /images"]
    E --> F["Job images pending"]
    F --> G["Queue: extract scenes + gen images"]
    G --> H["Job images completed"]
    H --> I["User POST /audio"]
    I --> J["Job audio pending"]
    J --> K["Queue: gen narration + TTS"]
    K --> L["Job audio completed"]
    L --> M["User POST /video"]
    M --> N["Job video pending"]
    N --> O["Queue: FFmpeg assemble"]
    O --> P["Job video completed ✓"]
    
    style A fill:#e1f5ff
    style P fill:#c8e6c9
```

---

## 11. Concurrencia & Escalabilidad

- **Múltiples usuarios**: Cada job es aislado (userId separado)
- **Múltiples jobs**: Bull Queue procesa secuencialmente por worker
- **Workers**: Configurable en backend/src/common/queue/
- **Bottleneck**: Rate limits de servicios externos (Azure, ElevenLabs)

```
Frontend (muchos usuarios)
    ↓
API (202 respuestas rápidas)
    ↓
Bull Queue (FIFO por worker)
    ↓
Servicios externos (rate limits)
```
