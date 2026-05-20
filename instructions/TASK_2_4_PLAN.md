# 🚀 TASK 2.4 — Replicate Images Endpoint (POST `/generate/images`)

**Status:** ⏳ READY TO START  
**Estimación:** ~5 horas  
**Criticidad:** ⭐⭐ REQUIRED for Week 2 completion  
**Fecha Inicio:** 17 mayo 2026  
**Depends On:** ✅ Task 2.3 (Queue Processor) COMPLETED

---

## 📌 Objetivo

Implementar el endpoint **POST `/generate/images`** que usa **Replicate API** para generar imágenes basadas en el script generado.

**Impacto:**
- ✅ Genera imágenes de portada/escenas basadas en prompt de Claude
- ✅ Reutiliza async queue pattern de Task 2.3
- ✅ Integra ReplicateService stub (ya existe, needs implementation)
- ✅ Completa pipeline: Script → Images → (Audio → Video próximamente)

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│              POST /generate/images (NEW)                     │
│  { scriptId: "uuid", imageDescription: "..." }              │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│            GenerateService.generateImages()                  │
│  1. Validate scriptId (fetch script result from DB)          │
│  2. Create Job(type: 'images', status: pending)             │
│  3. Add to Queue: {jobId, userId, type, scriptId}           │
│  4. Return: {jobId, status: pending}                        │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│         Queue Processor (Existing from Task 2.3)             │
│  Already handles: switch(job.data.type)                     │
│  Need to add: case 'images': → call generateImageContent()  │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│    🆕 GenerateService.generateImageContent()                │
│  1. Extract script from Job.result                          │
│  2. Call ReplicateService.generateImage(script)             │
│  3. Store image URLs in Job.result                          │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│           Replicate API (Flux model)                         │
│  Input: Text prompt (from script)                           │
│  Output: Image URL(s)                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Files to Modify

### 1️⃣ **ReplicateService** (`backend/src/integrations/replicate.service.ts`) — STUB EXISTS

**Current State:** Empty stub
```typescript
@Injectable()
export class ReplicateService {
  constructor() {}
  // No methods yet
}
```

**What to Implement:**
```typescript
async generateImage(prompt: string): Promise<string[]> {
  // Call Replicate API with Flux model
  // Return array of image URLs
}
```

---

### 2️⃣ **GenerateService** (`backend/src/generate/generate.service.ts`)

**Existing Methods:**
- `generateScript()` — ✅ Already refactored to async (Task 2.3)
- `generateScriptContent()` — ✅ Helper for processor

**New Methods to Add:**
```typescript
// 1. New endpoint handler (parallels generateScript)
async generateImages(userId: string, dto: GenerateImagesDto): Promise<GenerateImagesResponseDto>

// 2. Helper for processor (parallels generateScriptContent)
async generateImageContent(userId: string, jobData: {scriptId, story}): Promise<ImageGenerationResult>
```

---

### 3️⃣ **GenerateQueueProcessor** (`backend/src/generate/generate.queue.processor.ts`)

**Current State:** Handles type==='script'
```typescript
@Process()
async processGenerationJob(job: Job<GenerationJobData>) {
  switch (job.data.type) {
    case 'script':
      // ✅ Existing
      break;
    // Need to add:
    case 'images':
      // New
      break;
  }
}
```

---

### 4️⃣ **GenerateController** (`backend/src/generate/generate.controller.ts`)

**Existing Routes:**
- POST /generate/script — ✅ Implemented (Task 2.1)
- GET /generate/job/:jobId — ✅ Implemented (Task 2.1)
- POST /generate/images — ✅ STUB EXISTS, needs logic

**Current stub:**
```typescript
@Post('images')
@UseGuards(JwtAuthGuard)
async generateImages(
  @Request() req,
  @Body() dto: GenerateImagesDto,
) {
  // Empty stub — needs implementation
}
```

---

### 5️⃣ **DTOs** (`backend/src/generate/dto/`)

**Need to Create/Update:**
- `GenerateImagesDto` — Input validation
- `GenerateImagesResponseDto` — Response shape
- `ImageGenerationResult` — Processor output type

---

## 🎯 Implementation Step-by-Step

### PASO 1: Extend Queue Processor to Handle Images

**File:** `backend/src/generate/generate.queue.processor.ts`

**Current code** (Lines ~30-40):
```typescript
@Process()
async processGenerationJob(job: Job<GenerationJobData>) {
  const { jobId, userId, projectId, type, story } = job.data;
  
  try {
    await this.prisma.job.update({
      where: { id: jobId },
      data: { status: 'processing', progress: 25 },
    });

    let result;
    if (type === 'script') {
      result = await this.generateService.generateScriptContent(userId, { story });
    }
    // ← ADD HERE
    
    // Rest of code...
  }
}
```

**Add this:**
```typescript
    else if (type === 'images') {
      result = await this.generateService.generateImageContent(userId, {
        jobId,
        scriptId: job.data.scriptId,  // New field
      });
    }
```

---

### PASO 2: Implement ReplicateService

**File:** `backend/src/integrations/replicate.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import Replicate from 'replicate';

@Injectable()
export class ReplicateService {
  private readonly logger = new Logger(ReplicateService.name);
  private replicate: Replicate;

  constructor() {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      this.logger.warn('REPLICATE_API_TOKEN not configured');
    }
    this.replicate = new Replicate({ auth: token });
  }

  async generateImage(prompt: string, options?: { numImages?: number }): Promise<string[]> {
    try {
      this.logger.log(`Generating image with prompt: ${prompt.substring(0, 50)}...`);
      
      const output = await this.replicate.run(
        'black-forest-labs/flux-pro',  // Model identifier
        {
          input: {
            prompt,
            num_outputs: options?.numImages ?? 1,
            image_size: '1024x1024',
            num_inference_steps: 20,  // Balance speed vs quality
            guidance_scale: 7.5,
          },
        }
      );

      // Output is array of image URLs
      const imageUrls = Array.isArray(output) ? output : [output];
      this.logger.log(`✅ Generated ${imageUrls.length} image(s)`);
      return imageUrls;
    } catch (error) {
      this.logger.error(`❌ Replicate API error: ${error.message}`);
      throw new Error(`Image generation failed: ${error.message}`);
    }
  }
}
```

---

### PASO 3: Add generateImageContent to GenerateService

**File:** `backend/src/generate/generate.service.ts`

**Add to constructor:**
```typescript
constructor(
  // ... existing injections
  private readonly replicateService: ReplicateService,  // Add this
) {}
```

**Add new method:**
```typescript
async generateImageContent(
  userId: string,
  data: { jobId: string; scriptId: string },
): Promise<ImageGenerationResult> {
  // 1. Fetch original script Job to get the generated script
  const scriptJob = await this.prisma.job.findUnique({
    where: { id: data.scriptId },
  });

  if (!scriptJob || !scriptJob.result) {
    throw new BadRequestException('Script job not found or incomplete');
  }

  // 2. Parse script result to extract visual description
  let scriptContent: string;
  try {
    const parsed = JSON.parse(scriptJob.result);
    scriptContent = parsed.script || scriptJob.result;
  } catch {
    scriptContent = scriptJob.result;
  }

  // 3. Generate image prompt from script using Claude
  const imagePrompt = await this._buildImagePrompt(scriptContent);

  // 4. Call Replicate to generate image
  const imageUrls = await this.replicateService.generateImage(imagePrompt, {
    numImages: 1,  // Can be parametrized
  });

  return {
    imageUrls,
    prompt: imagePrompt,
    generatedAt: new Date(),
  };
}

private async _buildImagePrompt(scriptContent: string): Promise<string> {
  // Use Claude to create a detailed image prompt from script
  const message = await this.anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `Based on this story script, create a concise visual description for generating a cover image (max 100 words):

${scriptContent}

Respond with ONLY the visual description, no explanations.`,
      },
    ],
  });

  return this._extractTextFromResponse(message);
}
```

---

### PASO 4: Add generateImages Endpoint

**File:** `backend/src/generate/generate.controller.ts`

**Replace stub:**
```typescript
@Post('images')
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Generate images from script' })
@ApiResponse({ status: 200, description: 'Job queued' })
async generateImages(
  @Request() req,
  @Body() dto: GenerateImagesDto,
) {
  return this.generateService.generateImages(req.user.sub, dto);
}
```

---

### PASO 5: Add GenerateImagesDto

**File:** `backend/src/generate/dto/generate-images.dto.ts` (NEW FILE)

```typescript
import { IsString, IsNotEmpty, IsOptional, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateImagesDto {
  @ApiProperty({
    description: 'Job ID from previous script generation',
    example: 'uuid-script-job',
  })
  @IsString()
  @IsNotEmpty()
  scriptId: string;

  @ApiProperty({
    description: 'Optional custom description for image generation',
    example: 'A futuristic city at sunset',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(10, 500)
  imageDescription?: string;
}

export class GenerateImagesResponseDto {
  @ApiProperty({ example: 'uuid-images-job' })
  jobId: string;

  @ApiProperty({ enum: ['pending', 'processing', 'completed', 'failed'] })
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @ApiProperty({
    example: 'Image generation queued',
    required: false,
  })
  message?: string;

  @ApiProperty()
  createdAt: Date;
}

export interface ImageGenerationResult {
  imageUrls: string[];
  prompt: string;
  generatedAt: Date;
}
```

---

### PASO 6: Extend GenerateService.generateImages

**File:** `backend/src/generate/generate.service.ts`

**Add method:**
```typescript
async generateImages(
  userId: string,
  dto: GenerateImagesDto,
): Promise<GenerateImagesResponseDto> {
  // 1. Validate input
  if (!dto.scriptId || dto.scriptId.trim().length === 0) {
    throw new BadRequestException('scriptId is required');
  }

  // 2. Verify script job exists and belongs to user
  const scriptJob = await this.prisma.job.findUnique({
    where: { id: dto.scriptId },
  });

  if (!scriptJob) {
    throw new NotFoundException('Script job not found');
  }

  if (scriptJob.userId !== userId) {
    throw new ForbiddenException('Unauthorized access to this script');
  }

  // 3. Create Image Job
  const imageJob = await this.prisma.job.create({
    data: {
      userId,
      projectId: scriptJob.projectId,
      type: 'images',
      status: 'pending',
      progress: 0,
    },
  });

  // 4. Queue image generation job
  await this.queue.addGenerationJob({
    jobId: imageJob.id,
    userId,
    projectId: scriptJob.projectId,
    type: 'images',
    scriptId: dto.scriptId,
    _startTime: Date.now(),
  });

  // 5. Return immediately
  return {
    jobId: imageJob.id,
    status: 'pending',
    message: 'Image generation queued',
    createdAt: imageJob.createdAt,
  };
}
```

---

### PASO 7: Update GenerateModule

**File:** `backend/src/generate/generate.module.ts`

**Verify ReplicateService is injected:**
```typescript
@Module({
  imports: [PrismaModule, AuthModule, QueueModule, BullModule.registerQueue({ name: 'generation' })],
  providers: [
    GenerateService,
    GenerateQueueProcessor,
    ReplicateService,  // ← Make sure it's here
    ElevenLabsService,
    VideoService,
  ],
  exports: [GenerateService],
})
export class GenerateModule {}
```

---

### PASO 8: Update Queue Service Interface

**File:** `backend/src/common/queue/queue.service.ts`

**Update GenerationJobData interface:**
```typescript
export interface GenerationJobData {
  jobId: string;
  userId: string;
  projectId: string | null;
  type: 'script' | 'images' | 'audio' | 'video';
  story?: string;           // For script generation
  scriptId?: string;        // For images/audio/video (references script)
  imageDescription?: string; // Optional for images
  _startTime: number;
}
```

---

### PASO 9: Build & Test

**Commands:**
```bash
# 1. Build (should EXIT CODE 0)
npm run build

# 2. Type checking
npm run start:dev

# 3. Test endpoint (in another terminal)
curl -X POST http://localhost:3000/generate/images \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{"scriptId": "<uuid-from-script-generation>"}'
```

**Expected Response:**
```json
{
  "jobId": "uuid-images-job",
  "status": "pending",
  "message": "Image generation queued",
  "createdAt": "2026-05-17T00:35:00Z"
}
```

---

## ✅ Validation Checklist

- [ ] npm run build: EXIT CODE 0
- [ ] TypeScript: 0 errors
- [ ] ReplicateService.generateImage() implemented
- [ ] GenerateService.generateImages() queues job
- [ ] GenerateService.generateImageContent() calls Replicate
- [ ] Processor handles type='images' case
- [ ] Controller endpoint calls generateImages()
- [ ] DTOs validate input/output shapes
- [ ] Test endpoint returns jobId + pending status
- [ ] GET /generate/job/:jobId shows progress updates

---

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| "REPLICATE_API_TOKEN not configured" | Add to `.env.local` |
| Replicate returns 401 | Check token validity on replicate.com |
| Image generation takes too long | Reduce `num_inference_steps` in ReplicateService |
| TypeScript errors on new methods | Verify types imported in generate.service.ts |
| Processor doesn't pick up images | Verify queue.service.ts interface updated |

---

## 📊 Tracking

**Started:** 17 mayo 2026  
**Estimated Completion:** ~5 hours  
**Blockers:** None (Task 2.3 ✅)  
**Next Task:** 2.5 (Audio generation via ElevenLabs)

---

**Created by:** Development planning (Mayo 17, 2026)  
**Reference:** Task 2.3 async queue pattern  
**Reuse Pattern:** Same as script generation but calls ReplicateService instead of Claude
