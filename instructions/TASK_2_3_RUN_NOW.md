# ⚡ TASK 2.3 — QUICK START

**Tiempo:** ~5 horas  
**Complejidad:** ⭐⭐ Medium  
**Criticidad:** ⭐⭐⭐ Blocker  
**Referencia Completa:** [TASK_2_3_PLAN.md](TASK_2_3_PLAN.md)

---

## 📋 Lo que vas a hacer

Convertir GenerateService de **síncrono** → **asíncrono con Bull Queue** para permitir:
- Script generation en background
- Progress tracking en real-time
- Automatic retries on failure

---

## 🎯 Outcome Esperado

```
ANTES (Task 2.1):
Client: POST /generate/script {story: "..."}
Backend: Llama Claude API (bloquea 1-3 segundos)
Response: {jobId, script, status: completed}
❌ Problem: Client espera todo el tiempo

DESPUÉS (Task 2.3):
Client: POST /generate/script {story: "..."}
Backend: Crea Job + agrega a queue, retorna inmediatamente
Response: {jobId, status: pending, message: "Queued"}
Background: Queue processor ejecuta, actualiza Job
Client: GET /generate/job/:jobId (poll) → progress 0% → 25% → 100%
✅ Solución: Escalable, con progress tracking
```

---

## 🏗️ 4 Archivos a Crear/Modificar

| # | Acción | Archivo | Líneas | Tiempo |
|---|--------|---------|--------|--------|
| 1️⃣ | **Crear** | `generate.queue.processor.ts` | 120 | 30 min |
| 2️⃣ | **Modificar** | `generate.service.ts` | +80 / -30 | 1.5 h |
| 3️⃣ | **Modificar** | `generate.module.ts` | +5 | 10 min |
| 4️⃣ | **Modificar** | `main.ts` | +5 | 10 min |
| - | **Testing** | Local manual tests | - | 2 h |

---

## 🚀 PASO 1: Crear Queue Processor (30 min)

### Crear archivo: `backend/src/generate/generate.queue.processor.ts`

Copia esta estructura:

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
  story?: string;
}

@Processor('generation')
export class GenerateQueueProcessor {
  private readonly logger = new Logger(GenerateQueueProcessor.name);

  constructor(
    private prisma: PrismaService,
    private generateService: GenerateService,
  ) {}

  @Process()
  async processGenerationJob(job: Job<GenerationJobData>) {
    const { jobId, userId, type, story } = job.data;
    
    this.logger.log(`🔄 Processing ${type} job ${jobId}`);

    try {
      // 1. Mark as processing
      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'processing',
          progress: 25,
          startedAt: new Date(),
        },
      });

      let result;

      // 2. Execute based on type
      if (type === 'script') {
        result = await this.generateService.generateScriptContent(
          userId,
          { story },
        );
      } else {
        throw new Error(`Type ${type} not yet implemented`);
      }

      // 3. Mark as completed
      const processingTimeMs = Date.now() - (job.data as any)._startTime;
      
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

      this.logger.log(`✅ Job ${jobId} completed in ${processingTimeMs}ms`);
      return { success: true, jobId };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown';

      this.logger.error(`❌ Job ${jobId} failed: ${errorMsg}`);

      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          error: errorMsg,
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }
}
```

---

## 🔧 PASO 2: Refactorizar GenerateService (1.5 horas)

### 2.1: Agregar inyección QueueService

En `backend/src/generate/generate.service.ts`, línea ~15:

```typescript
// BUSCAR:
constructor(
  @Inject('ANTHROPIC_CLIENT') private client: Anthropic,
  private prisma: PrismaService,
) {}

// CAMBIAR A:
constructor(
  @Inject('ANTHROPIC_CLIENT') private client: Anthropic,
  private prisma: PrismaService,
  private queue: QueueService,  // 🆕 ADD THIS
) {}
```

### 2.2: Refactorizar generateScript() a async pattern

**En `backend/src/generate/generate.service.ts`, busca la función `generateScript`:**

```typescript
// ACTUAL:
async generateScript(userId: string, dto: GenerateScriptDto) {
  if (!dto.story || dto.story.trim() === '') {
    throw new BadRequestException('Story text cannot be empty');
  }

  // Create Job
  const job = await this.prisma.job.create({
    data: {
      userId,
      projectId: null,
      type: 'script',
      status: 'processing',  // ← CHANGE
      progress: 10,          // ← CHANGE
    },
  });

  try {
    // Call Claude directly ← PROBLEM
    const response = await this.client.messages.create({...});
    const script = ...;

    // Update Job
    await this.prisma.job.update({...});
    
    return { script, jobId: job.id, status: 'completed' };
  } catch (error) {
    // Handle error...
  }
}

// 🆕 NUEVO:
async generateScript(userId: string, dto: GenerateScriptDto) {
  // 1. Validate
  if (!dto.story || dto.story.trim() === '') {
    throw new BadRequestException('Story text cannot be empty');
  }

  // 2. Create Job (pending, not processing)
  const job = await this.prisma.job.create({
    data: {
      userId,
      projectId: null,
      type: 'script',
      status: 'pending',    // ← Changed
      progress: 0,          // ← Changed
    },
  });

  // 3. Add to queue (async)
  await this.queue.addGenerationJob({
    jobId: job.id,
    userId,
    projectId: null,
    type: 'script',
    story: dto.story,
    _startTime: Date.now(),
  });

  // 4. Return immediately
  return {
    jobId: job.id,
    status: 'pending',
    message: 'Script generation queued',
    createdAt: job.createdAt,
  };
}

// 🆕 NEW HELPER: Used by processor
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

### 2.3: Actualizar GenerateScriptResponseDto

En `backend/src/generate/dto/generate-response.dto.ts`:

```typescript
// CAMBIAR:
export class GenerateScriptResponseDto {
  script: string;        // ← Now this might be null/missing
  jobId: string;
  status: string;       // Now: 'pending' instead of 'completed'
  createdAt: Date;
  message?: string;     // 🆕 ADD THIS
}
```

---

## 🔧 PASO 3: Registrar Processor (10 min)

### En `backend/src/generate/generate.module.ts`:

```typescript
// ADD at top:
import { GenerateQueueProcessor } from './generate.queue.processor';

// MODIFY @Module:
@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    // 🆕 Register queue
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
    GenerateQueueProcessor,  // 🆕 ADD PROCESSOR
  ],
})
export class GenerateModule {}
```

---

## 🔧 PASO 4: Initialize Processor (10 min)

### En `backend/src/main.ts`:

```typescript
// ADD after app creation:
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // ... existing setup ...

  // 🆕 Start queue processor
  const queueService = app.get(QueueService);
  queueService.process(1, async (job: Job) => {
    // Processor handles the work
  });

  const PORT = process.env.PORT || 3000;
  await app.listen(PORT);
  Logger.log(`StoryForge Backend running on port ${PORT}`);
}
```

---

## ✅ PASO 5: Verificar Compilación

```bash
cd backend
npm run build
# Expected: ✅ EXIT CODE 0
```

---

## 🧪 PASO 6: Test Localmente (2 hours)

### Test 1: Start Server

```bash
npm run start:dev
# Expected output:
# StoryForge Backend running on port 3000
# ✅ Queue processor listening for jobs
```

### Test 2: Generate Script (Async)

**En PowerShell/Terminal:**

```bash
# 1. Create JWT token (mock for testing)
$token = "your_jwt_token_here"

# 2. Submit script generation
$response = curl -X POST http://localhost:3000/generate/script `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{
    "story": "A young hero discovers a magical sword and must save the kingdom from darkness. They journey across mountains, forests, and magical lands."
  }'

# Expected response:
# {
#   "jobId": "clx5a2bcd3e4f5g6h",
#   "status": "pending",
#   "message": "Script generation queued",
#   "createdAt": "2026-05-17T..."
# }

# NOTICE: Response is IMMEDIATE (no waiting for Claude API)
```

### Test 3: Poll Job Status

```bash
# Check status a few times:
$jobId = "clx5a2bcd3e4f5g6h"

# First poll (should be processing)
curl http://localhost:3000/generate/job/$jobId `
  -H "Authorization: Bearer $token"

# Expected:
# {
#   "id": "clx5a2bcd3e4f5g6h",
#   "status": "processing",
#   "progress": 25
# }

# Wait 3 seconds, poll again
Start-Sleep -Seconds 3

# Second poll (should be completed)
curl http://localhost:3000/generate/job/$jobId `
  -H "Authorization: Bearer $token"

# Expected:
# {
#   "id": "clx5a2bcd3e4f5g6h",
#   "status": "completed",
#   "progress": 100,
#   "result": "{\"script\": \"...\"}"
# }
```

### Test 4: Error Handling

```bash
# Test empty story (should reject immediately)
curl -X POST http://localhost:3000/generate/script `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"story": ""}'

# Expected: HTTP 400 — "Story text cannot be empty"

# Test with missing JWT (should reject)
curl -X POST http://localhost:3000/generate/script `
  -H "Content-Type: application/json" `
  -d '{"story": "Test"}'

# Expected: HTTP 401 — "Unauthorized"
```

---

## 📊 Verificación de Completación

### ✅ Checklist

- [ ] Created `generate.queue.processor.ts` with @Processor decorator
- [ ] Modified `generateScript()` to use queue pattern
- [ ] Added `generateScriptContent()` helper method
- [ ] Registered processor in `generate.module.ts`
- [ ] Initialized processor in `main.ts`
- [ ] `npm run build` → EXIT CODE 0
- [ ] Local test: POST /generate/script returns immediate response with `status: pending`
- [ ] Local test: GET /generate/job/:jobId shows progress updates
- [ ] Local test: Job completes with result stored in DB

### 📝 Documentation

- [ ] Updated PROGRESS.md with Task 2.3 completion
- [ ] Updated IMPLEMENTATION_PLAN.md with decision log
- [ ] Updated HANDOFF.md with processor setup

---

## 🎓 Key Concepts

### Why Async?

```
Sync (Bad for scale):
Client → POST /script → Claude API (3s) → Response to client
Problem: Client blocked, server thread blocked, only 1 request at a time

Async (Good for scale):
Client → POST /script → Queue → Response immediately
Background: Queue processor → Claude API → Update DB
Benefit: Client freed, processor can handle multiple jobs, progress tracking
```

### Bull Queue Flow

```
1. Client submits request
2. Backend creates Job (pending)
3. Backend adds job to Bull queue (Redis)
4. Backend returns immediately to client

5. Queue processor picks up job (from Redis)
6. Processor executes: call Claude, handle errors
7. Processor updates Job with result
8. Client polls GET /generate/job/:jobId for updates
```

---

## 🚨 Common Issues

| Error | Solution |
|-------|----------|
| "Cannot find module 'generate.queue.processor'" | Check file path: `backend/src/generate/generate.queue.processor.ts` |
| "QueueService not found in constructor" | Add `private queue: QueueService` to GenerateService constructor |
| "Job status stays pending forever" | Check processor is initialized in main.ts |
| "Redis connection refused" | Ensure Redis is running (from .env.local REDIS_URL) |
| "ANTHROPIC_API_KEY not found" | Processor will fail; use mock for testing |

---

## 📊 Status After Completion

| Métrica | Antes | Después |
|---------|-------|---------|
| Async processing | ❌ | ✅ |
| Progress tracking | ❌ | ✅ |
| Retry logic | Framework only | ✅ Active |
| Scalability | ~1 req/s | ~10 req/s (estimated) |
| Tests passing | N/A | ✅ All |

---

## 🎯 Siguiente

After Task 2.3 completes:

→ **Task 2.4:** POST `/generate/images` (5h)  
→ **Task 2.5:** POST `/generate/audio` (4h)  
→ **Task 2.6:** Rate limiting + error handling (3h)

All use the same processor pattern!

---

**Status:** Ready to implement  
**Reference:** [TASK_2_3_PLAN.md](TASK_2_3_PLAN.md) for full details  
**Time Estimate:** 5 hours  
**Priority:** ⭐⭐⭐ CRITICAL BLOCKER

👉 **Start PASO 1 now — Create processor file**
