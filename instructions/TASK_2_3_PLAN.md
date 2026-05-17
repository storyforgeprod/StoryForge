# 🚀 TASK 2.3 — Job Queue Processor Implementation

**Status:** 🔄 IN PROGRESS  
**Estimación:** ~5 horas  
**Criticidad:** ⭐⭐⭐ BLOCKER — Requerido para Tasks 2.4, 2.5, 2.6  
**Fecha Inicio:** 17 mayo 2026

---

## 📌 Objetivo

Implementar el **Bull Queue Processor** que consume jobs desde Redis y ejecuta generaciones de forma asíncrona y resiliente.

**Impacto:**
- ✅ Script generation se procesa en background
- ✅ Habilita Video generation pipeline
- ✅ Retry logic automático en failures
- ✅ Progress tracking en real-time (GET /generate/job/:jobId)

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                   GenerateController                         │
│  POST /generate/script { story: "..." }                      │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                   GenerateService                            │
│  1. Create Job(status=pending, progress=0)                   │
│  2. Add to Queue: queue.addGenerationJob({jobId, type})      │
│  3. Return: {jobId, status: pending}                         │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                   Bull Queue (Redis)                         │
│  Pending Jobs: [Job{...}, Job{...}, ...]                     │
│  In Progress: [Job{...}]                                     │
│  Completed: [Job{...}]                                       │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│              🆕 Queue Processor (THIS TASK)                  │
│  Process job (jobId, type, userId, projectId)               │
│  1. Retrieve Job from DB                                     │
│  2. Execute based on type (script, image, audio, video)      │
│  3. Update Job with result or error                          │
│  4. Emit progress events                                     │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│              Database + Storage Updates                      │
│  Job: {status: completed, result, processingTime}           │
│  Output: {script, images[], audioUrl, videoUrl}             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Archivos Clave (Existentes)

### 1️⃣ **QueueService** (`backend/src/common/queue/queue.service.ts`)

**Estado:** ✅ Framework implementado, processor FALTA

**Lo que existe:**
```typescript
export class QueueService {
  private generationQueue: Queue;

  async addGenerationJob(data: GenerationJobData) {
    // Agrega job a la queue con retry logic
  }

  async process(concurrency: number, processor: ProcessorFn) {
    // ← AQUÍ es donde nos connectamos como consumers
  }

  async getJobStatus(jobId: string) { /* ... */ }
  async cleanOldJobs(olderThan: Date) { /* ... */ }
}
```

**Lo que necesitamos:** Implementar el `ProcessorFn` que consume los jobs.

### 2️⃣ **GenerateService** (`backend/src/generate/generate.service.ts`)

**Estado:** ✅ Completo, pero NO usa queue actualmente

**Lo que existe:**
- `generateScript(userId, dto)` → SÍNCRONO (bloquea cliente)
- `getJobStatus(jobId, userId)` → Lee estado de DB

**Lo que necesitamos cambiar:**
```typescript
// ACTUAL (Síncrono — no escalable)
async generateScript(userId, dto) {
  // 1. Create Job
  // 2. Call Claude API directamente ← PROBLEMA: bloquea
  // 3. Update Job
}

// NUEVO (Asíncrono — escalable)
async generateScript(userId, dto) {
  // 1. Create Job(status: pending)
  // 2. Add to Queue ← Job procesado en background
  // 3. Return immediately con jobId (status: pending)
}
```

### 3️⃣ **QueueModule** (`backend/src/common/queue/queue.module.ts`)

**Estado:** ✅ Importado en AppModule

**Necesita:** Initialización del processor cuando bootstrap.

---

## 🎯 Implementación Step-by-Step

### PASO 1: Crear Processor File

**Archivo nuevo:** `backend/src/generate/generate.queue.processor.ts`

```typescript
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { GenerateService } from './generate.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { Logger } from '@nestjs/common';

interface GenerationJobData {
  jobId: string;
  userId: string;
  projectId: string | null;
  type: 'script' | 'images' | 'audio' | 'video';
  story?: string;  // For script generation
  scriptId?: string; // For images/audio/video (references script)
}

@Processor('generation')  // Queue name must match QueueService
export class GenerateQueueProcessor {
  private readonly logger = new Logger(GenerateQueueProcessor.name);

  constructor(
    private prisma: PrismaService,
    private generateService: GenerateService,
  ) {}

  @Process()
  async processGenerationJob(job: Job<GenerationJobData>) {
    const { jobId, userId, projectId, type, story } = job.data;
    
    this.logger.log(`🔄 Processing job ${jobId} (type: ${type})`);

    try {
      // 1. Update Job: Mark as in progress
      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'processing',
          progress: 25,
          startedAt: new Date(),
        },
      });

      // 2. Execute based on type
      let result;
      
      switch (type) {
        case 'script':
          result = await this.generateService.generateScriptContent(
            userId,
            { story },
          );
          break;
        
        case 'images':
          result = await this.generateService.generateImages(
            userId,
            { scriptId: job.data.scriptId },
          );
          break;
        
        case 'audio':
          result = await this.generateService.generateAudio(
            userId,
            { scriptId: job.data.scriptId },
          );
          break;
        
        case 'video':
          result = await this.generateService.generateVideo(
            userId,
            { projectId },
          );
          break;
        
        default:
          throw new Error(`Unknown job type: ${type}`);
      }

      // 3. Update Job: Mark as completed
      const processingTimeMs = Date.now() - job.data._startTime;
      
      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          progress: 100,
          result: JSON.stringify(result),
          processingTimeMs,
          completedAt: new Date(),
        },
      });

      this.logger.log(
        `✅ Job ${jobId} completed in ${processingTimeMs}ms`,
      );

      return { success: true, jobId, result };

    } catch (error) {
      const errorMsg = error instanceof Error 
        ? error.message 
        : 'Unknown error';

      this.logger.error(`❌ Job ${jobId} failed: ${errorMsg}`);

      // Update Job: Mark as failed
      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          error: errorMsg,
          completedAt: new Date(),
        },
      });

      // Re-throw to Bull (handles retries)
      throw error;
    }
  }

  // Optional: Handle job failure after all retries exhausted
  @Process('failed')
  async handleJobFailed(job: Job) {
    this.logger.warn(
      `⚠️ Job ${job.id} failed permanently after ${job.attemptsMade} retries`,
    );
    // Optional: Send notification, clean up, etc.
  }
}
```

### PASO 2: Modificar GenerateService

**Cambios a:** `backend/src/generate/generate.service.ts`

**Cambio 1: Agregar inyección de QueueService**

```typescript
export class GenerateService {
  constructor(
    private anthropic: Anthropic,
    private prisma: PrismaService,
    // 🆕 Agregar esto:
    private queue: QueueService,
    private replicate: ReplicateService,
    private elevenlabs: ElevenLabsService,
  ) {}
}
```

**Cambio 2: Refactorizar generateScript para usar queue**

```typescript
// VIEJO (Síncrono)
async generateScript(userId: string, dto: GenerateScriptDto) {
  // Create Job
  const job = await this.prisma.job.create({...});
  
  // Call Claude
  const response = await this.client.messages.create({...});
  
  // Return
  return { jobId: job.id, script, status: 'completed' };
}

// 🆕 NUEVO (Asíncrono con queue)
async generateScript(userId: string, dto: GenerateScriptDto) {
  // 1. Validate input
  if (!dto.story || dto.story.trim() === '') {
    throw new BadRequestException('Story text cannot be empty');
  }

  // 2. Create Job with status=pending
  const job = await this.prisma.job.create({
    data: {
      userId,
      projectId: null,
      type: 'script',
      status: 'pending',        // ← Changed from 'processing'
      progress: 0,              // ← Changed from 10
    },
  });

  // 3. Add to queue (processor will handle it)
  await this.queue.addGenerationJob({
    jobId: job.id,
    userId,
    projectId: null,
    type: 'script',
    story: dto.story,
    _startTime: Date.now(),  // For tracking processingTimeMs
  });

  // 4. Return immediately (don't wait for Claude)
  return {
    jobId: job.id,
    status: 'pending',        // ← Changed from 'completed'
    message: 'Script generation queued. Check status with GET /generate/job/:jobId',
    createdAt: job.createdAt,
  };
}

// 🆕 NEW: Método privado para generar script (usado por processor)
async generateScriptContent(userId: string, data: { story: string }) {
  const response = await this.client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: this._buildScriptPrompt(data.story),
      },
    ],
  });

  return {
    script: this._extractTextFromResponse(response),
  };
}
```

### PASO 3: Registrar Processor en GenerateModule

**Cambios a:** `backend/src/generate/generate.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { GenerateController } from './generate.controller';
import { GenerateService } from './generate.service';
import { GenerateQueueProcessor } from './generate.queue.processor';  // 🆕

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    // 🆕 Register processor
    BullModule.registerQueue({
      name: 'generation',
    }),
  ],
  controllers: [GenerateController],
  providers: [
    GenerateService,
    ReplicateService,
    ElevenLabsService,
    VideoService,
    GenerateQueueProcessor,  // 🆕 Add processor
  ],
})
export class GenerateModule {}
```

### PASO 4: Inicializar Processor en AppModule Bootstrap

**Cambios a:** `backend/src/main.ts`

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // ... existing code ...

  // 🆕 Initialize queue processors
  const queueService = app.get(QueueService);
  
  queueService.process(1, async (job: Job) => {
    // Processor handles the work
    // This just starts listening
  });

  await app.listen(PORT);
  Logger.log(`Server running on port ${PORT}`);
}
```

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Processor receives job correctly
- [ ] Job status updates from pending → processing → completed
- [ ] Result is correctly stored in Job.result
- [ ] Error is stored on failure
- [ ] processingTimeMs is calculated

### Integration Tests

```bash
# 1. Start backend + Redis
npm run start:dev

# 2. In another terminal, submit a script job
curl -X POST http://localhost:3000/generate/script \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"story": "Test story"}'

# Response:
{
  "jobId": "clx5a2bcd3e4f5g6h",
  "status": "pending",
  "message": "Script generation queued..."
}

# 3. Check job status (should be processing)
curl http://localhost:3000/generate/job/clx5a2bcd3e4f5g6h \
  -H "Authorization: Bearer <JWT>"

# Response:
{
  "id": "clx5a2bcd3e4f5g6h",
  "status": "processing",
  "progress": 25,
  "result": null
}

# 4. Wait 5 seconds, check again (should be completed)
curl http://localhost:3000/generate/job/clx5a2bcd3e4f5g6h \
  -H "Authorization: Bearer <JWT>"

# Response:
{
  "id": "clx5a2bcd3e4f5g6h",
  "status": "completed",
  "progress": 100,
  "result": "{\"script\": \"...\"}"
}
```

---

## 🔗 Dependencias de Tasks

**Task 2.3 desbloqueará:**

- ✅ **Task 2.4:** POST `/generate/images` — Usa mismo processor pattern
- ✅ **Task 2.5:** POST `/generate/audio` — Usa mismo processor pattern
- ✅ **Task 2.6:** POST `/generate/video` — Usa mismo processor pattern

**Sin Task 2.3:**
- ❌ Cannot scale to multiple concurrent generations
- ❌ Client experiences long timeouts waiting for API calls
- ❌ No progress tracking
- ❌ No retry logic

---

## 📊 Estimación

| Fase | Tiempo | Tareas |
|------|--------|--------|
| **Implementación** | 2h | Crear processor, refactorizar service |
| **Testing Local** | 1.5h | Manual testing + edge cases |
| **Documentación** | 0.5h | Comentarios + docstrings |
| **Debugging** | 1h | Buffer for issues |
| **Total** | **5h** | |

---

## 📋 Entregables

Al completar Task 2.3:

- [x] `backend/src/generate/generate.queue.processor.ts` — Processor implementation
- [x] `backend/src/generate/generate.service.ts` — Refactored (async pattern)
- [x] `backend/src/generate/generate.module.ts` — Updated imports
- [x] Testing completed locally
- [x] npm build EXIT 0
- [x] Updated PROGRESS.md
- [x] Updated IMPLEMENTATION_PLAN.md

---

## 🚀 Siguientes Pasos Después de Task 2.3

1. ✅ Task 2.4: Images endpoint (5h) — Same processor pattern
2. ✅ Task 2.5: Audio endpoint (4h) — Same processor pattern
3. ✅ Task 2.6: Rate limiting (3h)
4. ✅ Task 2.7: E2E testing (3h)

---

**Status:** Ready to implement  
**Next:** Create generate.queue.processor.ts + refactor service  
**Est. Completion:** +5 hours  

👉 **Start with:** Creating the processor file based on PASO 1 code above.
