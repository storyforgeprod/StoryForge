# ⚡ TASK 2.4 RUN NOW — Quick Implementation Guide

**Time:** ~5 hours | **Status:** Ready to start | **Depends:** Task 2.3 ✅

---

## 🎯 What to Do (6 PASOS)

### PASO 1: Update Queue Processor (5 lines)

**File:** `backend/src/generate/generate.queue.processor.ts` (line ~40)

Inside the `processGenerationJob()` method, find the section:
```typescript
if (type === 'script') {
  result = await this.generateService.generateScriptContent(userId, { story });
}
```

**Add after:**
```typescript
else if (type === 'images') {
  result = await this.generateService.generateImageContent(userId, {
    jobId,
    scriptId: job.data.scriptId,
  });
}
```

---

### PASO 2: Implement ReplicateService

**File:** `backend/src/integrations/replicate.service.ts`

**Replace entire file:**
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
        'black-forest-labs/flux-pro',
        {
          input: {
            prompt,
            num_outputs: options?.numImages ?? 1,
            image_size: '1024x1024',
            num_inference_steps: 20,
            guidance_scale: 7.5,
          },
        }
      );

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

**In constructor, add ReplicateService:**
```typescript
constructor(
  // ... existing
  private readonly replicateService: ReplicateService,
) {}
```

**Add methods at end of class:**
```typescript
async generateImageContent(
  userId: string,
  data: { jobId: string; scriptId: string },
): Promise<any> {
  const scriptJob = await this.prisma.job.findUnique({
    where: { id: data.scriptId },
  });

  if (!scriptJob || !scriptJob.result) {
    throw new BadRequestException('Script job not found or incomplete');
  }

  let scriptContent: string;
  try {
    const parsed = JSON.parse(scriptJob.result);
    scriptContent = parsed.script || scriptJob.result;
  } catch {
    scriptContent = scriptJob.result;
  }

  const imagePrompt = await this._buildImagePrompt(scriptContent);
  const imageUrls = await this.replicateService.generateImage(imagePrompt, {
    numImages: 1,
  });

  return {
    imageUrls,
    prompt: imagePrompt,
    generatedAt: new Date(),
  };
}

private async _buildImagePrompt(scriptContent: string): Promise<string> {
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

async generateImages(
  userId: string,
  dto: any,
): Promise<any> {
  if (!dto.scriptId || dto.scriptId.trim().length === 0) {
    throw new BadRequestException('scriptId is required');
  }

  const scriptJob = await this.prisma.job.findUnique({
    where: { id: dto.scriptId },
  });

  if (!scriptJob) {
    throw new NotFoundException('Script job not found');
  }

  if (scriptJob.userId !== userId) {
    throw new ForbiddenException('Unauthorized access to this script');
  }

  const imageJob = await this.prisma.job.create({
    data: {
      userId,
      projectId: scriptJob.projectId,
      type: 'images',
      status: 'pending',
      progress: 0,
    },
  });

  await this.queue.addGenerationJob({
    jobId: imageJob.id,
    userId,
    projectId: scriptJob.projectId,
    type: 'images',
    scriptId: dto.scriptId,
    _startTime: Date.now(),
  });

  return {
    jobId: imageJob.id,
    status: 'pending',
    message: 'Image generation queued',
    createdAt: imageJob.createdAt,
  };
}
```

---

### PASO 4: Update DTOs

**File:** `backend/src/generate/dto/generate-images.dto.ts` (CREATE NEW)

```typescript
import { IsString, IsNotEmpty, IsOptional, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateImagesDto {
  @ApiProperty({ example: 'uuid-script-job' })
  @IsString()
  @IsNotEmpty()
  scriptId: string;

  @ApiProperty({ required: false })
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

  @ApiProperty({ required: false })
  message?: string;

  @ApiProperty()
  createdAt: Date;
}
```

---

### PASO 5: Update Controller

**File:** `backend/src/generate/generate.controller.ts`

Replace POST /generate/images stub:
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

**Also add import at top:**
```typescript
import { GenerateImagesDto, GenerateImagesResponseDto } from './dto/generate-images.dto';
```

---

### PASO 6: Build & Verify

```bash
# Build
npm run build

# Expected output:
# "Found 0 errors"
# "Successfully compiled" 

# If EXIT CODE = 0, you're done! ✅
echo "EXIT CODE: $LASTEXITCODE"
```

---

## 🧪 Quick Test (After PASO 6)

```bash
# Terminal 1: Start server
npm run start:dev

# Terminal 2: Generate script first (to get scriptId)
curl -X POST http://localhost:3000/generate/script \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d '{"story":"A knight discovers a hidden dragon"}'

# Copy the jobId from response (wait for it to complete)

# Then generate images using that scriptId
curl -X POST http://localhost:3000/generate/images \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d '{"scriptId":"<jobId-from-script>"}'
```

---

## ✅ Validation

- [ ] PASO 1: Processor added 'images' case
- [ ] PASO 2: ReplicateService.generateImage() works
- [ ] PASO 3: GenerateService has 3 new methods
- [ ] PASO 4: DTOs created with proper validators
- [ ] PASO 5: Controller calls generateImages()
- [ ] PASO 6: npm run build EXIT CODE 0
- [ ] Test endpoint returns {jobId, status: pending}

---

## 📚 Full Details

See: [TASK_2_4_PLAN.md](TASK_2_4_PLAN.md) for architecture, issues, and full explanations

---

**If stuck:** Check TASK_2_4_PLAN.md "Common Issues" section

**Time Estimate:** 4-5 hours to complete all 6 PASOes + testing
