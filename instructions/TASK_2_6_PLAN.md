# 🎬 TASK 2.6: POST `/generate/video` (FFmpeg Video Assembly)

**Timeline:** ~4 hours  
**Status:** READY TO START  
**Pattern:** Reuse async queue processor (proven in Tasks 2.3-2.5)  
**Criticality:** ⭐⭐⭐ CRITICAL for Week 2  

---

## 📋 Overview

**What:** Implement video assembly endpoint using FFmpeg to combine images, audio, and effects into final YouTube Shorts video.  
**Input:** Image URLs + Audio URL (from completed image/audio generation jobs)  
**Output:** Final video URL + job tracking  
**Pattern:** 
1. Client POST `/generate/video` with imageJobId + audioJobId → Server creates Job(pending)
2. Returns jobId immediately
3. Background processor calls FFmpeg → generates video → stores URL in Job result
4. Client polls GET `/job/:jobId` to track progress

**Files to Create/Modify:**
| File | Purpose | Status |
|------|---------|--------|
| `backend/src/integrations/video.service.ts` | FFmpeg wrapper | STUB (replace) |
| `backend/src/generate/generate.service.ts` | Business logic for video assembly | MODIFY (add methods) |
| `backend/src/generate/generate.queue.processor.ts` | Queue consumer for async execution | MODIFY (add case) |
| `backend/src/generate/generate.controller.ts` | HTTP endpoints | MODIFY (add POST /video) |
| `backend/src/generate/dto/generate-video.dto.ts` | DTO for input validation | CREATE |
| `backend/src/common/queue/queue.service.ts` | Queue interface update | MODIFY (if needed) |

---

## 🔧 Implementation Steps

### PASO 1: Implement VideoService

**File:** `backend/src/integrations/video.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const execPromise = promisify(exec);

interface VideoAssemblyOptions {
  duration?: number; // seconds
  fps?: number; // frames per second
  bitrate?: string; // video bitrate
}

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);
  private readonly outputDir = process.env.VIDEO_OUTPUT_DIR || '/tmp/storyforge-videos';

  constructor() {
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async assembleVideo(
    imageUrls: string[],
    audioUrl: string,
    options?: VideoAssemblyOptions,
  ): Promise<string> {
    if (!imageUrls || imageUrls.length === 0) {
      throw new Error('At least one image is required');
    }

    if (!audioUrl || audioUrl.trim().length === 0) {
      throw new Error('Audio URL is required');
    }

    const videoId = uuidv4();
    const outputPath = path.join(this.outputDir, `${videoId}.mp4`);

    try {
      // 1. Download image and audio files
      const imagePath = await this._downloadImage(imageUrls[0], videoId);
      const audioPath = await this._downloadAudio(audioUrl, videoId);

      // 2. Get audio duration
      const duration = await this._getAudioDuration(audioPath);

      // 3. Build FFmpeg command for video assembly
      const ffmpegCmd = this._buildFFmpegCommand(
        imagePath,
        audioPath,
        outputPath,
        duration,
        options,
      );

      // 4. Execute FFmpeg
      this.logger.log(`🎬 Assembling video: ${ffmpegCmd}`);
      await execPromise(ffmpegCmd, { timeout: 300000 }); // 5 min timeout

      // 5. Verify output exists
      if (!fs.existsSync(outputPath)) {
        throw new Error('FFmpeg did not produce output video');
      }

      // 6. Return video URL (for now, return local path; in production, upload to storage)
      return `file://${outputPath}`;
    } catch (error) {
      this.logger.error('FFmpeg error:', error);
      // Cleanup on error
      await this._cleanup(videoId);
      throw error;
    }
  }

  private async _downloadImage(
    imageUrl: string,
    videoId: string,
  ): Promise<string> {
    const imagePath = path.join(this.outputDir, `${videoId}_image.png`);

    // If imageUrl is base64 (from local generation)
    if (imageUrl.startsWith('data:')) {
      const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(imagePath, Buffer.from(base64Data, 'base64'));
      return imagePath;
    }

    // If imageUrl is HTTP(S), download it
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(imagePath, Buffer.from(arrayBuffer));
    return imagePath;
  }

  private async _downloadAudio(audioUrl: string, videoId: string): Promise<string> {
    const audioPath = path.join(this.outputDir, `${videoId}_audio.mp3`);

    // If audioUrl is base64 (from ElevenLabs)
    if (audioUrl.startsWith('data:')) {
      const base64Data = audioUrl.replace(/^data:audio\/\w+;base64,/, '');
      fs.writeFileSync(audioPath, Buffer.from(base64Data, 'base64'));
      return audioPath;
    }

    // If audioUrl is HTTP(S), download it
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(audioPath, Buffer.from(arrayBuffer));
    return audioPath;
  }

  private async _getAudioDuration(audioPath: string): Promise<number> {
    try {
      const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1:noprint_wrappers=1 "${audioPath}"`;
      const { stdout } = await execPromise(cmd);
      return parseFloat(stdout.trim());
    } catch (error) {
      this.logger.warn('Could not get audio duration, using default 60s');
      return 60; // Default fallback
    }
  }

  private _buildFFmpegCommand(
    imagePath: string,
    audioPath: string,
    outputPath: string,
    duration: number,
    options?: VideoAssemblyOptions,
  ): string {
    const fps = options?.fps || 30;
    const bitrate = options?.bitrate || '2000k';
    const videoWidth = 1080;
    const videoHeight = 1920; // YouTube Shorts vertical format

    // FFmpeg command:
    // - scale image to vertical format (1080x1920)
    // - loop image for audio duration
    // - combine with audio
    // - output as MP4 (H.264)
    return (
      `ffmpeg -loop 1 -i "${imagePath}" ` +
      `-i "${audioPath}" ` +
      `-c:v libx264 -preset fast ` +
      `-vf "scale=${videoWidth}:${videoHeight}:force_original_aspect_ratio=decrease,pad=${videoWidth}:${videoHeight}:(ow-iw)/2:(oh-ih)/2" ` +
      `-c:a aac -b:a 128k ` +
      `-t ${duration} ` +
      `-y "${outputPath}" 2>&1`
    );
  }

  private async _cleanup(videoId: string): Promise<void> {
    try {
      const files = [
        path.join(this.outputDir, `${videoId}_image.png`),
        path.join(this.outputDir, `${videoId}_audio.mp3`),
        path.join(this.outputDir, `${videoId}.mp4`),
      ];

      for (const file of files) {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      }
    } catch (error) {
      this.logger.warn(`Cleanup error for ${videoId}:`, error);
    }
  }
}
```

**Key Points:**
- Wraps FFmpeg CLI for video assembly
- Handles both base64 and HTTP(S) image/audio URLs
- Scales images to YouTube Shorts vertical format (1080x1920)
- Loops image for audio duration
- Combines with AAC audio track
- Returns output path (production: upload to storage)
- Auto-cleanup on error

---

### PASO 2: Create GenerateVideoDto

**File:** `backend/src/generate/dto/generate-video.dto.ts`

```typescript
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateVideoDto {
  @ApiProperty({
    example: 'job_123abc',
    description: 'ID of completed image generation job',
  })
  @IsNotEmpty()
  @IsString()
  imageJobId: string = '';

  @ApiProperty({
    example: 'job_456def',
    description: 'ID of completed audio generation job',
  })
  @IsNotEmpty()
  @IsString()
  audioJobId: string = '';

  @ApiProperty({
    example: 30,
    description: 'Optional video frames per second (default: 30)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  fps?: number;

  @ApiProperty({
    example: '2000k',
    description: 'Optional video bitrate (default: 2000k)',
    required: false,
  })
  @IsOptional()
  @IsString()
  bitrate?: string;
}

export interface GenerateVideoResponseDto {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
  createdAt: Date;
}

export interface VideoAssemblyResult {
  videoUrl: string;
  duration: number; // in seconds
  fileSize: number; // in bytes
  format: string; // 'mp4'
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
  scriptId?: string;                 // For images/audio/video generation
  imageDescription?: string;         // For images (optional)
  voiceId?: string;                  // For audio (optional)
  imageJobId?: string;               // For video (references image job)
  audioJobId?: string;               // For video (references audio job)
  fps?: number;                      // For video (optional)
  bitrate?: string;                  // For video (optional)
  _startTime?: number;
}
```

---

### PASO 4: Add Methods to GenerateService

**File:** `backend/src/generate/generate.service.ts`

Add to `GenerateService` class:

```typescript
async generateVideo(
  userId: string,
  dto: GenerateVideoDto,
): Promise<GenerateVideoResponseDto> {
  // 1. Validate inputs
  if (!dto.imageJobId || dto.imageJobId.trim().length === 0) {
    throw new BadRequestException('imageJobId is required');
  }

  if (!dto.audioJobId || dto.audioJobId.trim().length === 0) {
    throw new BadRequestException('audioJobId is required');
  }

  // 2. Verify image job exists and belongs to user
  const imageJob = await this.prisma.job.findUnique({
    where: { id: dto.imageJobId },
  });

  if (!imageJob || imageJob.userId !== userId) {
    throw new ForbiddenException('Unauthorized access to this image job');
  }

  if (imageJob.status !== 'completed') {
    throw new BadRequestException(
      `Image job must be completed first (current: ${imageJob.status})`,
    );
  }

  // 3. Verify audio job exists and belongs to user
  const audioJob = await this.prisma.job.findUnique({
    where: { id: dto.audioJobId },
  });

  if (!audioJob || audioJob.userId !== userId) {
    throw new ForbiddenException('Unauthorized access to this audio job');
  }

  if (audioJob.status !== 'completed') {
    throw new BadRequestException(
      `Audio job must be completed first (current: ${audioJob.status})`,
    );
  }

  // 4. Create Video Job
  let videoJob;
  try {
    videoJob = await this.prisma.job.create({
      data: {
        userId,
        projectId: imageJob.projectId,
        type: 'video',
        status: 'pending',
        progress: 0,
      },
    });
  } catch (error) {
    console.error('Failed to create video job:', error);
    throw new BadRequestException('Failed to create video assembly job');
  }

  // 5. Queue the job
  try {
    await this.queue.addGenerationJob({
      jobId: videoJob.id,
      userId,
      projectId: imageJob.projectId,
      type: 'video',
      imageJobId: dto.imageJobId,
      audioJobId: dto.audioJobId,
      fps: dto.fps,
      bitrate: dto.bitrate,
      _startTime: Date.now(),
    });
  } catch (error) {
    console.error('Failed to queue video job:', error);
    await this.prisma.job.update({
      where: { id: videoJob.id },
      data: {
        status: 'failed',
        error: 'Failed to queue video assembly job',
      },
    });
    throw new BadRequestException('Failed to queue video assembly job');
  }

  // 6. Return immediately
  return {
    jobId: videoJob.id,
    status: 'pending',
    message: 'Video assembly queued',
    createdAt: videoJob.createdAt,
  };
}

async generateVideoContent(
  userId: string,
  data: { jobId: string; imageJobId: string; audioJobId: string; fps?: number; bitrate?: string },
): Promise<VideoAssemblyResult> {
  // 1. Fetch the image job result
  const imageJob = await this.prisma.job.findUnique({
    where: { id: data.imageJobId },
  });

  if (!imageJob || imageJob.status !== 'completed') {
    throw new BadRequestException('Image job not completed');
  }

  const imageResult = JSON.parse(imageJob.result || '{}');
  const imageUrls = imageResult.imageUrls || [];

  // 2. Fetch the audio job result
  const audioJob = await this.prisma.job.findUnique({
    where: { id: data.audioJobId },
  });

  if (!audioJob || audioJob.status !== 'completed') {
    throw new BadRequestException('Audio job not completed');
  }

  const audioResult = JSON.parse(audioJob.result || '{}');
  const audioUrl = audioResult.audioUrl || '';

  // 3. Validate we have both resources
  if (!imageUrls || imageUrls.length === 0) {
    throw new BadRequestException('No image URLs found in image job result');
  }

  if (!audioUrl) {
    throw new BadRequestException('No audio URL found in audio job result');
  }

  // 4. Call VideoService to assemble video
  const videoUrl = await this.videoService.assembleVideo(imageUrls, audioUrl, {
    fps: data.fps,
    bitrate: data.bitrate,
  });

  // 5. Get file size and duration
  const fs = require('fs');
  const fileSize = fs.statSync(videoUrl.replace('file://', '')).size;
  const duration = audioResult.audioLength || 60; // Use audio length from job

  return {
    videoUrl,
    duration,
    fileSize,
    format: 'mp4',
    generatedAt: new Date(),
  };
}
```

**Add to Constructor:**
```typescript
constructor(
  private prisma: PrismaService,
  private queue: QueueService,
  private replicateService: ReplicateService,
  private elevenLabsService: ElevenLabsService,
  private videoService: VideoService,  // ADD THIS
  private anthropic: Anthropic,
) {}
```

**Add import at top:**
```typescript
import { VideoAssemblyResult } from './dto/generate-video.dto';
```

---

### PASO 5: Extend Queue Processor

**File:** `backend/src/generate/generate.queue.processor.ts`

In the `@Process()` switch statement, add:

```typescript
} else if (type === 'video') {
  // Mark processing
  await this.prisma.job.update({
    where: { id: jobId },
    data: {
      status: 'processing',
      progress: 25,
      startedAt: new Date(),
    },
  });

  result = await this.generateService.generateVideoContent(userId, {
    jobId,
    imageJobId: job.data.imageJobId || '',
    audioJobId: job.data.audioJobId || '',
    fps: job.data.fps,
    bitrate: job.data.bitrate,
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

Also update the local interface in processor file to include video fields:

```typescript
interface GenerationJobData {
  jobId: string;
  userId: string;
  projectId: string | null;
  type: 'script' | 'images' | 'audio' | 'video';
  story?: string;
  scriptId?: string;
  imageDescription?: string;
  voiceId?: string;
  imageJobId?: string;
  audioJobId?: string;
  fps?: number;
  bitrate?: string;
  _startTime: number;
}
```

---

### PASO 6: Implement Controller Endpoint

**File:** `backend/src/generate/generate.controller.ts`

Add to `GenerateController`:

```typescript
@Post('video')
@UseGuards(JwtAuthGuard)
@ApiOperation({
  summary: 'Assemble final video from images and audio',
  description: 'Creates async video assembly job. Returns jobId for polling.',
})
@ApiResponse({
  status: 202,
  description: 'Video assembly job created',
})
@ApiResponse({ status: 400, description: 'Invalid request' })
@ApiResponse({ status: 403, description: 'Unauthorized' })
async generateVideo(
  @CurrentUser() user,
  @Body() dto: GenerateVideoDto,
): Promise<GenerateVideoResponseDto> {
  return this.generateService.generateVideo(user.userId, dto);
}
```

**Import at top of file:**
```typescript
import { GenerateVideoDto, GenerateVideoResponseDto } from './dto/generate-video.dto';
```

---

### PASO 7: Update GenerateModule

**File:** `backend/src/generate/generate.module.ts`

No changes needed — `VideoService` already listed in providers (from earlier stub).

---

### PASO 8: Install FFmpeg Dependencies

**Step A: Ensure FFmpeg is installed**

On Windows:
```bash
# Via Chocolatey (if available)
choco install ffmpeg

# Or download from https://ffmpeg.org/download.html
```

On Linux (Ubuntu/Debian):
```bash
sudo apt-get install ffmpeg ffprobe
```

**Step B: Install npm package for UUID generation**
```bash
npm install uuid
npm install --save-dev @types/uuid
```

---

### PASO 9: Compilation & Testing

**Step A: Verify TypeScript compilation**
```bash
npm run build
# Expected: ✅ EXIT CODE 0
```

**Step B: Test server startup**
```bash
npm run start:dev
# Expected: ✅ Queue processor initializes, routes map correctly
```

**Step C: Manual testing (via curl or REST client)**

```bash
# 1. Generate script first
curl -X POST http://localhost:3000/generate/script \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"story":"A hero defeats a dragon"}'
# Response: {jobId: "job_1", status: "pending"}

# 2. Poll until script completes
curl http://localhost:3000/generate/job/job_1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
# Wait for status: "completed"

# 3. Generate images from script
curl -X POST http://localhost:3000/generate/images \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scriptId":"job_1"}'
# Response: {jobId: "job_2", status: "pending"}

# 4. Poll until images complete
curl http://localhost:3000/generate/job/job_2 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
# Wait for status: "completed"

# 5. Generate audio from script
curl -X POST http://localhost:3000/generate/audio \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scriptId":"job_1"}'
# Response: {jobId: "job_3", status: "pending"}

# 6. Poll until audio complete
curl http://localhost:3000/generate/job/job_3 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
# Wait for status: "completed"

# 7. Finally, assemble video
curl -X POST http://localhost:3000/generate/video \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"imageJobId":"job_2","audioJobId":"job_3"}'
# Response: {jobId: "job_4", status: "pending"}

# 8. Poll video job
curl http://localhost:3000/generate/job/job_4 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
# Wait for status: "completed", result contains videoUrl
```

---

## 🎯 Success Criteria

✅ `npm run build` → EXIT CODE 0  
✅ `npm run start:dev` → Queue processor initializes, all routes map  
✅ POST `/generate/video` creates job + queues async execution  
✅ GET `/job/:jobId` tracks video assembly progress  
✅ FFmpeg executes and produces video file  
✅ Video URL returned in completed job result  
✅ User isolation enforced (can't access others' jobs)  

---

## 📚 Reference Code

**Pattern from Task 2.5 (Audio):**
- GenerateService: `generateAudio()` + `generateAudioContent()`
- Queue Processor: `case 'audio':` in switch statement
- Controller: `@Post('audio')` endpoint
- Service: ElevenLabsService wrapper

**Replication for Video:**
- GenerateService: `generateVideo()` + `generateVideoContent()`
- Queue Processor: `case 'video':` in switch statement
- Controller: `@Post('video')` endpoint
- Service: VideoService wrapper (FFmpeg)

---

## ⏱️ Estimated Breakdown

| Step | Time | Notes |
|------|------|-------|
| PASO 1: VideoService | 45 min | Implement FFmpeg wrapper + file handling |
| PASO 2: GenerateVideoDto | 15 min | Simple DTO creation |
| PASO 3: Queue interface | 10 min | Add imageJobId + audioJobId fields |
| PASO 4: GenerateService methods | 45 min | Add generateVideo + generateVideoContent |
| PASO 5: Queue processor | 30 min | Add video case in switch |
| PASO 6: Controller endpoint | 20 min | Add @Post endpoint |
| PASO 7: Module update | 5 min | No changes needed |
| PASO 8: Dependencies | 15 min | Install FFmpeg + uuid |
| PASO 9: Compilation & testing | 30 min | Build + manual testing |
| **TOTAL** | **~3.5 hours** | On track for Week 2 |

---

## 🚀 After Task 2.6

**Task 2.7:** Rate Limiting (Throttle decorator) — 2 hours  
**Week 2 Total:** 5.5 hours remaining (on track)

---

## 📌 Notes for Developer

1. **FFmpeg Installation:** Must be installed on system (not npm package)
2. **Output Directory:** Defaults to `/tmp/storyforge-videos`; configure via `VIDEO_OUTPUT_DIR` env var
3. **Video Format:** YouTube Shorts vertical (1080x1920)
4. **File Cleanup:** Auto-cleanup on error; consider adding periodic cleanup job
5. **Production Consideration:** Upload to Supabase storage instead of returning local file path
6. **Performance:** FFmpeg execution can be slow (30-60 seconds). Consider async worker pool for scale.
7. **Error Handling:** FFmpeg stderr output important for debugging; all errors logged

---

**Created:** 2026-05-17 01:35 UTC  
**Task Status:** 🟢 READY FOR IMPLEMENTATION  
**Blocker:** None — all dependencies (Tasks 2.1-2.5) complete
