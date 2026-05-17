# Semana 2 — Backend Integration + Queue Processing

**Estado:** Iniciando (desde 16-mayo)  
**Duración:** 5 días de desarrollo  
**Equipo:** Backend developer  
**Objetivo:** Integración Prisma completa + Claude testing + Job queue processor + Replicate/ElevenLabs stubs

---

## 📋 Tareas Ordenadas

### PRIORIDAD 1 — Core Integration (2.1-2.2)

#### Task 2.1: Integrar GenerateService con Prisma
**Descripción:** Modificar GenerateService para usar Prisma y crear Job records

**Cambios Requeridos:**
1. Inyectar `PrismaService` en `GenerateService`
2. Crear método `generateScript()` mejorado:
   - Antes de generar: crear `Job` record con status `'processing'`
   - Tras generar: actualizar Job con status `'completed'` + guardar script
   - En error: actualizar Job con status `'failed'` + error message
3. Retornar Job ID en lugar de hardcoded ID

**Archivos a Modificar:**
- `src/generate/generate.service.ts` — agregar Prisma integration
- `src/generate/generate.controller.ts` — usar JobId del Prisma record

**Estimación:** 2h  
**Verificación:** Unit test que crea Job en Prisma

---

#### Task 2.2: Testear POST /generate/script con Claude API Real
**Descripción:** Validar que endpoint funciona end-to-end con Claude API

**Pasos:**
1. Llenar `ANTHROPIC_API_KEY` en `.env.local`
2. Ejecutar `npm run start:dev`
3. Postman/curl request:
   ```bash
   curl -X POST http://localhost:3000/generate/script \
     -H "Content-Type: application/json" \
     -d '{
       "story": "A brave knight embarks on an epic quest to save the kingdom from darkness...",
       "style": "anime",
       "duration": 60
     }'
   ```
4. Validar:
   - Status 200 OK
   - Response tiene `script`, `jobId`, `status: "completed"`
   - Script es texto coherente (no vacío)
5. Verificar Prisma DB:
   - Job creado con ese ID
   - Script guardado en DB

**Archivos:**
- `src/generate/generate.service.ts` — debugging si falla
- `src/generate/generate.controller.ts` — validar endpoint

**Estimación:** 1h  
**Verificación:** Log de respuesta exitosa + Job en DB

---

### PRIORIDAD 2 — Queue Infrastructure (2.3)

#### Task 2.3: Implementar Job Queue Processor
**Descripción:** Configurar Bull queue processor para jobs async

**Cambios Requeridos:**
1. Crear `GenerateQueueProcessor` service:
   - Inyectar QueueService + GenerateService + PrismaService
   - Escuchar eventos `add`, `completed`, `failed`
   - Actualizar Prisma Job status en cada evento
2. Registrar processor en GenerateModule
3. Crear método para simular jobs largos (con delay)

**Código Base:**
```typescript
// src/generate/generate-queue.processor.ts
@Injectable()
export class GenerateQueueProcessor {
  constructor(
    private queueService: QueueService,
    private generateService: GenerateService,
    private prisma: PrismaService,
  ) {
    this.setupProcessors();
  }

  private setupProcessors() {
    this.queueService.process(2, async (job) => {
      const data = job.data as GenerationJobData;
      // Procesar job
      await this.prisma.job.update({
        where: { id: data.jobId },
        data: { status: 'processing' },
      });
      // ... lógica de generación
    });
  }
}
```

**Archivos:**
- `src/generate/generate-queue.processor.ts` — NEW
- `src/generate/generate.module.ts` — agregar processor
- `src/common/queue/queue.service.ts` — ya existe, usar como-es

**Estimación:** 3h  
**Verificación:** Jobs procesados + Prisma status actualizado

---

### PRIORIDAD 3 — Additional AI Endpoints (2.4-2.5)

#### Task 2.4: Endpoint POST /generate/images
**Descripción:** Implementar generación de imágenes con Replicate

**Cambios Requeridos:**
1. Mejorar `ReplicateService`:
   - Agregar API key
   - Implementar flujo Flux Schnell
   - Retornar URLs de imágenes
2. Agregar endpoint `/generate/images` en controller
3. Agregar DTO: `GenerateImagesDto`
4. Crear Job record + queue job para procesamiento

**Archivos:**
- `src/generate/replicate.service.ts` — completar implementation
- `src/generate/generate.controller.ts` — agregar endpoint
- `src/generate/dto/generate-images.dto.ts` — NEW

**Estimación:** 3h  
**Status Actual:** Stub (TODO comments)

---

#### Task 2.5: Endpoint POST /generate/audio
**Descripción:** Implementar TTS con ElevenLabs

**Cambios Requeridos:**
1. Mejorar `ElevenLabsService`:
   - Agregar API key
   - Implementar synthesize()
   - Guardar audio en Supabase Storage
2. Agregar endpoint `/generate/audio` en controller
3. Agregar DTO: `GenerateAudioDto`

**Archivos:**
- `src/generate/elevenlabs.service.ts` — completar implementation
- `src/generate/generate.controller.ts` — agregar endpoint
- `src/generate/dto/generate-audio.dto.ts` — NEW

**Estimación:** 2h  
**Status Actual:** Stub (TODO comments)

---

### PRIORIDAD 4 — Quality & Testing (2.6-2.7)

#### Task 2.6: Rate Limiting + Error Handling
**Descripción:** Agregar rate limiting per-user + global error handler

**Cambios Requeridos:**
1. Crear `RateLimitGuard` que use Prisma quota checking
2. Crear `GlobalExceptionFilter` para errores
3. Interceptor para logging de requests/responses
4. Validación de limites de cuota monthly

**Archivos:**
- `src/common/guards/rate-limit.guard.ts` — NEW
- `src/common/filters/global-exception.filter.ts` — NEW
- `src/common/interceptors/logging.interceptor.ts` — NEW
- `src/main.ts` — registrar filters/interceptors globales

**Estimación:** 2h

---

#### Task 2.7: Testing E2E Local
**Descripción:** Validar flujo completo: script → images → audio

**Pasos:**
1. Crear `test/generate.e2e.spec.ts` con 3 tests:
   - POST `/generate/script` → validates output
   - POST `/generate/images` → validates output
   - POST `/generate/audio` → validates output
2. Ejecutar: `npm run test:e2e`
3. Todos deben pasar (mocks si falta real API keys)

**Archivos:**
- `test/generate.e2e.spec.ts` — NEW
- `test/jest-e2e.json` — NEW

**Estimación:** 2h

---

## 🎯 Daily Breakdown

| Día | Tareas | Status |
|-----|--------|--------|
| Lunes | 2.1 + 2.2 (Prisma integration + Claude testing) | ⏳ |
| Martes | 2.3 (Queue processor setup) | ⏳ |
| Miércoles | 2.4 + 2.5 (Images + Audio endpoints) | ⏳ |
| Jueves | 2.6 (Rate limiting + error handling) | ⏳ |
| Viernes | 2.7 (E2E testing + final validation) | ⏳ |

---

## 🚀 Hito Final (EOW2)

```
✅ GenerateService integrado con Prisma
✅ POST /generate/script testeado con Claude real
✅ Job queue processor funcionando
✅ POST /generate/images con Replicate stub
✅ POST /generate/audio con ElevenLabs stub
✅ Rate limiting implementado
✅ E2E tests pasando
✅ Backend listo para frontend (Semana 3)
```

---

## 📝 Notas Importantes

- **Supabase Setup:** Si no está configurado, usar local PostgreSQL en `.env.local`
- **API Keys:** Llenar credenciales en `.env.local` (no en .env.example)
- **Backups:** Backup Prisma schema antes de cambios grandes
- **Queue Local:** Usar Redis local o Upstash staging
- **Testing:** Unit tests > Integration tests > E2E tests

---

**Próximo Milestone:** Semana 3 (Frontend React boilerplate)
