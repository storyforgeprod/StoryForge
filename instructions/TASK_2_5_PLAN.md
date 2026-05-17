# 🎧 TASK 2.5: POST `/generate/audio` (ElevenLabs Voice Synthesis)

**Timeline:** ~4 hours  
**Status:** READY TO START  
**Pattern:** Reuse async queue processor (proven in Tasks 2.3-2.4)  
**Criticality:** ⭐⭐ REQUIRED for Week 2  

---

## 📋 Overview

**What:** Implement audio narration endpoint using ElevenLabs API for text-to-speech synthesis.  
**Input:** Script text (from completed script generation job)  
**Output:** Audio URL + job tracking  
**Pattern:** 
1. Client POST `/generate/audio` with scriptId → Server creates Job(pending)
2. Returns jobId immediately
3. Background processor calls ElevenLabs → generates audio → stores URL in Job result
4. Client polls GET `/job/:jobId` to track progress

**Files to Create/Modify:**
| File | Purpose | Status |
|------|---------|--------|
| `backend/src/integrations/elevenlabs.service.ts` | ElevenLabs API wrapper | STUB (replace) |
| `backend/src/generate/generate.service.ts` | Business logic for audio generation | MODIFY (add methods) |
| `backend/src/generate/generate.queue.processor.ts` | Queue consumer for async execution | MODIFY (add case) |
| `backend/src/generate/generate.controller.ts` | HTTP endpoints | MODIFY (add POST /audio) |
| `backend/src/generate/dto/generate-audio.dto.ts` | DTO for input validation | CREATE |
| `backend/src/common/queue/queue.service.ts` | Queue interface update | MODIFY (if needed) |

---

## 🔧 Implementation Steps

### PASO 1: Implement ElevenLabsService

**File:** `backend/src/integrations/elevenlabs.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ElevenLabsOptions {
  voiceId?: string;
  stability?: number;
  similarityBoost?: number;
}

@Injectable()
export class ElevenLabsService {
  private readonly logger = new Logger(ElevenLabsService.name);
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.elevenlabs.io/v1';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get('ELEVENLABS_API_KEY', '');
    if (!this.apiKey) {
      this.logger.warn(
        'ELEVENLABS_API_KEY not configured. Audio generation will fail.',
      );
    }
  }

  async generateAudio(
    text: string,
    options?: ElevenLabsOptions,
  ): Promise<string> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    const voiceId = options?.voiceId || 'EXAVITQu4vr4xnSDxMaL'; // Default: Sarah
    const url = `${this.apiUrl}/text-to-speech/${voiceId}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.substring(0, 3000), // ElevenLabs limit per request
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: options?.stability ?? 0.5,
            similarity_boost: options?.similarityBoost ?? 0.75,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(
          `ElevenLabs API error: ${response.status} - ${error}`,
        );
        throw new Error(`ElevenLabs API failed: ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      
      // For now, return base64 encoded audio
      // In production, upload to storage and return URL
      const base64 = Buffer.from(audioBuffer).toString('base64');
      return `data:audio/mpeg;base64,${base64}`;
    } catch (error) {
      this.logger.error('ElevenLabs error:', error);
      throw error;
    }
  }
}
```

**Key Points:**
- Uses Fetch API (Node.js 18+)
- Returns base64 audio for simplicity (later can upload to storage)
- Truncates text to 3000 chars per ElevenLabs limit
- Configurable voice_id, stability, similarity_boost
- Error handling with logging

---

### PASO 2: Create GenerateAudioDto

**File:** `backend/src/generate/dto/generate-audio.dto.ts`

```typescript
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateAudioDto {
  @ApiProperty({
    example: 'job_123abc',
    description: 'ID of completed script generation job',
  })
  @IsNotEmpty()
  @IsString()
  scriptId: string;

  @ApiProperty({
    example: 'EXAVITQu4vr4xnSDxMaL',
    description: 'Optional ElevenLabs voice ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  voiceId?: string;
}

export interface GenerateAudioResponseDto {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
  createdAt: Date;
}

export interface AudioGenerationResult {
  audioUrl: string;
  audioLength: number; // in seconds
  textUsed: string; // First 100 chars for reference
  generatedAt: Date;
}
```

---

### PASO 3: Update Queue Interface

**File:** `backend/src/common/queue/queue.service.ts`

Add optional fields to `GenerationJobData`:

```typescript
export interface GenerationJobData {
  jobId: string;
  userId: string;
  projectId: string | null;
  type: 'script' | 'images' | 'audio' | 'video';
  story?: string;                    // For script generation
  scriptId?: string;                 // For images/audio generation
  imageDescription?: string;         // For images (optional)
  voiceId?: string;                  // For audio (optional)
  _startTime?: number;
}
```

---

### PASO 4: Add Methods to GenerateService

**File:** `backend/src/generate/generate.service.ts`

Add to `GenerateService` class:

```typescript
async generateAudio(
  userId: string,
  dto: GenerateAudioDto,
): Promise<GenerateAudioResponseDto> {
  if (!dto.scriptId || dto.scriptId.trim().length === 0) {
    throw new BadRequestException('scriptId is required');
  }

  // Verify script job exists and belongs to user
  const scriptJob = await this.prisma.job.findUnique({
    where: { id: dto.scriptId },
  });

  if (!scriptJob || scriptJob.userId !== userId) {
    throw new ForbiddenException('Unauthorized access to this script');
  }

  if (scriptJob.status !== 'completed') {
    throw new BadRequestException(
      `Script job must be completed first (current: ${scriptJob.status})`,
    );
  }

  // Create audio job
  const audioJob = await this.prisma.job.create({
    data: {
      userId,
      projectId: scriptJob.projectId,
      type: 'audio',
      status: 'pending',
      progress: 0,
    },
  });

  // Queue the job
  await this.queue.addGenerationJob({
    jobId: audioJob.id,
    userId,
    projectId: scriptJob.projectId,
    type: 'audio',
    scriptId: dto.scriptId,
    voiceId: dto.voiceId,
    _startTime: Date.now(),
  });

  return {
    jobId: audioJob.id,
    status: 'pending',
    message: 'Audio generation queued',
    createdAt: audioJob.createdAt,
  };
}

async generateAudioContent(
  userId: string,
  data: { jobId: string; scriptId: string; voiceId?: string },
): Promise<AudioGenerationResult> {
  // Fetch the script job result
  const scriptJob = await this.prisma.job.findUnique({
    where: { id: data.scriptId },
  });

  if (!scriptJob || scriptJob.status !== 'completed') {
    throw new BadRequestException('Script job not completed');
  }

  const scriptResult = JSON.parse(scriptJob.result || '{}');
  const scriptText = scriptResult.script || '';

  if (!scriptText) {
    throw new BadRequestException('Script text not found');
  }

  // Generate audio via ElevenLabs
  const audioUrl = await this.elevenLabsService.generateAudio(scriptText, {
    voiceId: data.voiceId,
  });

  // Calculate audio length (rough estimate: 150 words per minute)
  const wordCount = scriptText.split(' ').length;
  const audioLength = Math.ceil((wordCount / 150) * 60);

  return {
    audioUrl,
    audioLength,
    textUsed: scriptText.substring(0, 100),
    generatedAt: new Date(),
  };
}
```

**Add to Constructor:**
```typescript
constructor(
  private readonly prisma: PrismaService,
  private readonly queue: QueueService,
  private readonly replicateService: ReplicateService,
  private readonly elevenLabsService: ElevenLabsService,  // ADD THIS
  private readonly videoService: VideoService,
  private readonly anthropic: Anthropic,
) {}
```

---

### PASO 5: Extend Queue Processor

**File:** `backend/src/generate/generate.queue.processor.ts`

In the `@Process()` switch statement, add:

```typescript
} else if (type === 'audio') {
  // Mark processing
  await this.prisma.job.update({
    where: { id: jobId },
    data: {
      status: 'processing',
      progress: 25,
      startedAt: new Date(),
    },
  });

  result = await this.generateService.generateAudioContent(userId, {
    jobId,
    scriptId: job.data.scriptId || '',
    voiceId: job.data.voiceId,
  });

  // Mark completed
  const processingTimeMs = Date.now() - (job.data._startTime || Date.now());
  await this.prisma.job.update({
    where: { id: jobId },
    data: {
      status: 'completed',
      progress: 100,
      result: JSON.stringify(result),
      completedAt: new Date(),
      processingTimeMs,
    },
  });

  return result;
```

---

### PASO 6: Implement Controller Endpoint

**File:** `backend/src/generate/generate.controller.ts`

Add to `GenerateController`:

```typescript
@Post('audio')
@UseGuards(JwtAuthGuard)
@ApiOperation({
  summary: 'Generate audio narration from script',
  description: 'Creates async audio generation job. Returns jobId for polling.',
})
@ApiResponse({
  status: 201,
  description: 'Audio generation job created',
  type: GenerateAudioResponseDto,
})
@ApiResponse({ status: 400, description: 'Invalid request' })
@ApiResponse({ status: 403, description: 'Unauthorized' })
async generateAudio(
  @CurrentUser() user,
  @Body() dto: GenerateAudioDto,
): Promise<GenerateAudioResponseDto> {
  return this.generateService.generateAudio(user.sub, dto);
}
```

**Import at top of file:**
```typescript
import { GenerateAudioDto, GenerateAudioResponseDto } from './dto/generate-audio.dto';
```

---

### PASO 7: Update GenerateModule

**File:** `backend/src/generate/generate.module.ts`

No changes needed — `ElevenLabsService` already added to providers.

---

### PASO 8: Compilation & Testing

**Step A: Install ElevenLabs package (if not already installed)**
```bash
npm install elevenlabs
```

**Step B: Verify TypeScript compilation**
```bash
npm run build
# Expected: ✅ EXIT CODE 0
```

**Step C: Test server startup**
```bash
npm run start:dev
# Expected: ✅ Queue processor initializes, routes map correctly
```

**Step D: Manual testing (via curl or REST client)**

```bash
# 1. First, generate a script (get scriptId)
curl -X POST http://localhost:3000/generate/script \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"story":"A hero defeats a dragon"}'
# Response: {jobId: "job_abc123", status: "pending"}

# 2. Poll until script completes
curl http://localhost:3000/generate/job/job_abc123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
# Wait for status: "completed"

# 3. Generate audio from script
curl -X POST http://localhost:3000/generate/audio \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scriptId":"job_abc123"}'
# Response: {jobId: "job_xyz789", status: "pending"}

# 4. Poll audio job
curl http://localhost:3000/generate/job/job_xyz789 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
# Wait for status: "completed", result contains audioUrl
```

---

## 🎯 Success Criteria

✅ `npm run build` → EXIT CODE 0  
✅ `npm run start:dev` → Queue processor initializes, all routes map  
✅ POST `/generate/audio` creates job + queues async execution  
✅ GET `/job/:jobId` tracks audio generation progress  
✅ Audio URL returned in completed job result  
✅ User isolation enforced (can't access others' jobs)  

---

## 📚 Reference Code

**Pattern from Task 2.4 (Images):**
- GenerateService: `generateImages()` + `generateImageContent()`
- Queue Processor: `case 'images':` in switch statement
- Controller: `@Post('images')` endpoint
- Service: ReplicateService wrapper

**Replication:** Exact same pattern for audio:
- GenerateService: `generateAudio()` + `generateAudioContent()`
- Queue Processor: `case 'audio':` in switch statement
- Controller: `@Post('audio')` endpoint
- Service: ElevenLabsService wrapper

---

## ⏱️ Estimated Breakdown

| Step | Time | Notes |
|------|------|-------|
| PASO 1: ElevenLabsService | 45 min | Implement API wrapper + error handling |
| PASO 2: GenerateAudioDto | 15 min | Simple DTO creation |
| PASO 3: Queue interface | 10 min | Add voiceId field |
| PASO 4: GenerateService methods | 45 min | Add generateAudio + generateAudioContent |
| PASO 5: Queue processor | 30 min | Add audio case in switch |
| PASO 6: Controller endpoint | 20 min | Add @Post endpoint |
| PASO 7: Module update | 5 min | No changes needed |
| PASO 8: Compilation & testing | 30 min | Build + manual curl testing |
| **TOTAL** | **~3.5 hours** | On track for Week 2 |

---

## 🚀 Next After Task 2.5

**Task 2.6:** Rate Limiting (Throttle decorator) — 2 hours  
**Task 2.7:** Video Assembly (FFmpeg) — 3 hours  
**Task 2.8:** E2E Testing (full pipeline) — 2 hours  

**Total Remaining Week 2:** ~10.5 hours (est. 3 working days)

---

## 📌 Notes for Developer

1. **ElevenLabs API Key:** Add to `.env`: `ELEVENLABS_API_KEY=sk_...`
2. **Voice IDs:** Common voices available in ElevenLabs dashboard (Sarah, Adam, Charlie, etc.)
3. **Audio Format:** Currently returns base64. For production, upload to Supabase storage + return URL.
4. **Text Limit:** ElevenLabs API has 3000 char limit per request. Script text should be truncated.
5. **Stability vs Similarity:** Lower stability = more variation; higher similarity = more natural but less stable.
6. **Cost:** ~$0.30 per 1M characters at current ElevenLabs pricing.

---

**Created:** 2026-05-17 01:20 UTC  
**Task Status:** 🟢 READY FOR IMPLEMENTATION  
**Blocker:** None — all dependencies (Tasks 2.1-2.4) complete
