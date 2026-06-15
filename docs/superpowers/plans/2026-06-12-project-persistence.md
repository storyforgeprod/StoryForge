# Project Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-create a `Project` + `Output` record when a video generation job completes, and expose `GET /projects` and `GET /projects/:id` endpoints protected by JWT.

**Architecture:** A new `ProjectService` is injected into `GenerateQueueProcessor`. When the video job completes, the processor calls `ProjectService.finalizeFromVideoJob` which traces the job chain (video → image → audio → script) using metadata stored on each job, then writes `Project` + `Output` in a single Prisma transaction. A `ProjectController` exposes read endpoints. No new Prisma models needed — the schema already has `Project`, `Job`, and `Output`.

**Tech Stack:** NestJS, Prisma, PostgreSQL, Jest + `@nestjs/testing`

**Spec:** `docs/superpowers/specs/2026-06-12-project-persistence-design.md`

---

## File Map

**Create:**
- `backend/src/projects/dto/project-response.dto.ts` — DTO shapes for API responses
- `backend/src/projects/project.service.ts` — `finalizeFromVideoJob`, `getProjects`, `getProjectById`, `_mapToDto`
- `backend/src/projects/project.service.spec.ts` — 9 unit tests for ProjectService
- `backend/src/projects/project.controller.ts` — `GET /projects`, `GET /projects/:id`
- `backend/src/projects/project.controller.spec.ts` — 3 unit tests for ProjectController
- `backend/src/projects/project.module.ts` — NestJS module declaration

**Modify:**
- `backend/src/generate/generate.service.ts` — add `metadata` field to images, audio, and video job creation
- `backend/src/generate/generate.queue.processor.ts` — inject `ProjectService`, call `finalizeFromVideoJob` after video completes
- `backend/src/generate/generate.module.ts` — import `ProjectModule`
- `backend/src/app.module.ts` — import `ProjectModule`

---

## Task 1: Project DTOs

**Files:**
- Create: `backend/src/projects/dto/project-response.dto.ts`

- [ ] **Step 1: Create the DTO file**

Create `backend/src/projects/dto/project-response.dto.ts`:

```typescript
export class OutputResponseDto {
  videoUrl!: string;
  audioUrl!: string | null;
  images!: string[];
  script!: string | null;
  duration!: number | null;
}

export class ProjectResponseDto {
  id!: string;
  title!: string;
  style!: string;
  duration!: number;
  status!: string;
  createdAt!: Date;
  output!: OutputResponseDto | null;
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/projects/dto/project-response.dto.ts
git commit -m "feat(projects): add ProjectResponseDto and OutputResponseDto"
```

---

## Task 2: `ProjectService.finalizeFromVideoJob` (TDD)

**Files:**
- Create: `backend/src/projects/project.service.ts`
- Create: `backend/src/projects/project.service.spec.ts`

- [ ] **Step 1: Create the service skeleton**

Create `backend/src/projects/project.service.ts`:

```typescript
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ProjectResponseDto } from './dto/project-response.dto';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(private readonly prisma: PrismaService) {}

  async finalizeFromVideoJob(
    _videoJobId: string,
    _userId: string,
    _videoUrl: string,
  ): Promise<void> {
    throw new Error('Not implemented');
  }

  async getProjects(_userId: string): Promise<ProjectResponseDto[]> {
    throw new Error('Not implemented');
  }

  async getProjectById(
    _projectId: string,
    _userId: string,
  ): Promise<ProjectResponseDto> {
    throw new Error('Not implemented');
  }

  private _mapToDto(_project: any): ProjectResponseDto {
    throw new Error('Not implemented');
  }
}
```

- [ ] **Step 2: Write the failing tests**

Create `backend/src/projects/project.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProjectService } from './project.service';
import { PrismaService } from '../common/prisma/prisma.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let prismaMock: any;

  const VIDEO_JOB = {
    id: 'vid-1',
    projectId: null,
    userId: 'user-1',
    metadata: JSON.stringify({ imageJobId: 'img-1', audioJobId: 'aud-1' }),
  };
  const IMAGE_JOB = {
    id: 'img-1',
    metadata: JSON.stringify({ scriptId: 'scr-1', style: 'bold-comic' }),
    result: JSON.stringify({ imageUrls: ['https://img.jpg'] }),
  };
  const AUDIO_JOB = {
    id: 'aud-1',
    result: JSON.stringify({ audioUrl: 'https://audio.mp3', audioLength: 45 }),
  };
  const SCRIPT_JOB = {
    id: 'scr-1',
    metadata: JSON.stringify({ story: 'A great story', targetDuration: 60 }),
    result: JSON.stringify({ script: 'Scene 1: Test' }),
  };

  beforeEach(async () => {
    prismaMock = {
      job: {
        findUnique: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 4 }),
      },
      project: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({ id: 'proj-1', title: 'Story #1' }),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
      },
      output: {
        create: jest.fn().mockResolvedValue({ id: 'out-1' }),
      },
      $transaction: jest.fn().mockImplementation(
        async (fn: (tx: any) => Promise<any>) => fn(prismaMock),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
  });

  describe('finalizeFromVideoJob', () => {
    it('creates Project and Output when video job completes', async () => {
      prismaMock.job.findUnique
        .mockResolvedValueOnce(VIDEO_JOB)
        .mockResolvedValueOnce(IMAGE_JOB)
        .mockResolvedValueOnce(AUDIO_JOB)
        .mockResolvedValueOnce(SCRIPT_JOB);

      await service.finalizeFromVideoJob('vid-1', 'user-1', 'https://video.mp4');

      expect(prismaMock.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            title: 'Story #1',
            style: 'bold-comic',
            status: 'completed',
          }),
        }),
      );
      expect(prismaMock.output.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            videoUrl: 'https://video.mp4',
            audioUrl: 'https://audio.mp3',
            images: ['https://img.jpg'],
          }),
        }),
      );
      expect(prismaMock.job.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: ['vid-1', 'img-1', 'aud-1', 'scr-1'] } },
          data: { projectId: 'proj-1' },
        }),
      );
    });

    it('returns early if videoJob.projectId is already set (idempotency)', async () => {
      prismaMock.job.findUnique.mockResolvedValueOnce({
        ...VIDEO_JOB,
        projectId: 'existing-proj',
      });

      await service.finalizeFromVideoJob('vid-1', 'user-1', 'https://video.mp4');

      expect(prismaMock.project.create).not.toHaveBeenCalled();
    });

    it('throws if video job is not found', async () => {
      prismaMock.job.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.finalizeFromVideoJob('vid-1', 'user-1', 'https://video.mp4'),
      ).rejects.toThrow();
    });

    it('throws if image job has no result', async () => {
      prismaMock.job.findUnique
        .mockResolvedValueOnce(VIDEO_JOB)
        .mockResolvedValueOnce(null);

      await expect(
        service.finalizeFromVideoJob('vid-1', 'user-1', 'https://video.mp4'),
      ).rejects.toThrow();
    });
  });

  describe('getProjects', () => {
    it('returns empty array when user has no projects', async () => {
      prismaMock.project.findMany.mockResolvedValue([]);

      const result = await service.getProjects('user-1');

      expect(result).toEqual([]);
    });

    it('returns mapped DTOs for user projects', async () => {
      prismaMock.project.findMany.mockResolvedValue([
        {
          id: 'proj-1',
          title: 'Story #1',
          style: 'bold-comic',
          duration: 60,
          status: 'completed',
          createdAt: new Date('2026-06-12'),
          outputs: [
            {
              videoUrl: 'https://video.mp4',
              audioUrl: 'https://audio.mp3',
              images: ['https://img.jpg'],
              script: 'Scene 1: Test',
              duration: 45,
            },
          ],
        },
      ]);

      const result = await service.getProjects('user-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'proj-1',
        title: 'Story #1',
        output: expect.objectContaining({
          videoUrl: 'https://video.mp4',
          audioUrl: 'https://audio.mp3',
        }),
      });
    });
  });

  describe('getProjectById', () => {
    it('returns project DTO when found and owned by user', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        userId: 'user-1',
        title: 'Story #1',
        style: 'bold-comic',
        duration: 60,
        status: 'completed',
        createdAt: new Date('2026-06-12'),
        outputs: [],
      });

      const result = await service.getProjectById('proj-1', 'user-1');

      expect(result.id).toBe('proj-1');
      expect(result.output).toBeNull();
    });

    it('throws NotFoundException when project is not found', async () => {
      prismaMock.project.findUnique.mockResolvedValue(null);

      await expect(
        service.getProjectById('missing', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when project belongs to another user', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        userId: 'other-user',
        outputs: [],
      });

      await expect(
        service.getProjectById('proj-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
```

- [ ] **Step 3: Run tests — verify they all fail**

```
cd backend && npx jest src/projects/project.service.spec.ts --no-coverage
```

Expected: all 9 tests fail (methods throw "Not implemented")

- [ ] **Step 4: Implement `finalizeFromVideoJob`**

Replace the `finalizeFromVideoJob` stub in `backend/src/projects/project.service.ts`:

```typescript
async finalizeFromVideoJob(
  videoJobId: string,
  userId: string,
  videoUrl: string,
): Promise<void> {
  await this.prisma.$transaction(async (tx) => {
    const videoJob = await tx.job.findUnique({ where: { id: videoJobId } });
    if (!videoJob) throw new Error(`Video job ${videoJobId} not found`);
    if (videoJob.projectId) return;

    const videoMeta = JSON.parse(videoJob.metadata || '{}') as {
      imageJobId: string;
      audioJobId: string;
    };
    const { imageJobId, audioJobId } = videoMeta;
    if (!imageJobId || !audioJobId) {
      throw new Error(
        `Video job ${videoJobId} missing imageJobId or audioJobId in metadata`,
      );
    }

    const imageJob = await tx.job.findUnique({ where: { id: imageJobId } });
    if (!imageJob?.result) {
      throw new Error(`Image job ${imageJobId} not found or has no result`);
    }
    const imageMeta = JSON.parse(imageJob.metadata || '{}') as {
      scriptId: string;
      style: string;
    };
    const imageResult = JSON.parse(imageJob.result) as { imageUrls: string[] };
    const { scriptId, style } = imageMeta;

    const audioJob = await tx.job.findUnique({ where: { id: audioJobId } });
    if (!audioJob?.result) {
      throw new Error(`Audio job ${audioJobId} not found or has no result`);
    }
    const audioResult = JSON.parse(audioJob.result) as {
      audioUrl: string;
      audioLength: number;
    };

    if (!scriptId) throw new Error(`Image job ${imageJobId} missing scriptId in metadata`);
    const scriptJob = await tx.job.findUnique({ where: { id: scriptId } });
    if (!scriptJob) throw new Error(`Script job ${scriptId} not found`);
    const scriptMeta = JSON.parse(scriptJob.metadata || '{}') as {
      story: string;
      targetDuration: number;
    };
    const scriptResult = scriptJob.result
      ? (JSON.parse(scriptJob.result) as { script: string })
      : { script: '' };

    const projectCount = await tx.project.count({ where: { userId } });
    const title = `Story #${projectCount + 1}`;

    const project = await tx.project.create({
      data: {
        userId,
        title,
        storyText: scriptMeta.story || '',
        style: style || 'anime',
        duration: scriptMeta.targetDuration || 60,
        status: 'completed',
      },
    });

    await tx.output.create({
      data: {
        projectId: project.id,
        script: scriptResult.script || '',
        images: imageResult.imageUrls || [],
        audioUrl: audioResult.audioUrl,
        videoUrl,
        duration: audioResult.audioLength || scriptMeta.targetDuration || 60,
        format: 'mp4',
        resolution: '1080x1920',
      },
    });

    await tx.job.updateMany({
      where: { id: { in: [videoJobId, imageJobId, audioJobId, scriptId] } },
      data: { projectId: project.id },
    });

    this.logger.log(
      `[ProjectService] Created project ${project.id} ("${title}") from video job ${videoJobId}`,
    );
  });
}
```

- [ ] **Step 5: Run only `finalizeFromVideoJob` tests — verify they pass**

```
cd backend && npx jest src/projects/project.service.spec.ts --no-coverage -t "finalizeFromVideoJob"
```

Expected: 4 tests pass

- [ ] **Step 6: Commit**

```bash
git add backend/src/projects/project.service.ts backend/src/projects/project.service.spec.ts
git commit -m "feat(projects): implement ProjectService.finalizeFromVideoJob with TDD"
```

---

## Task 3: `ProjectService.getProjects` + `getProjectById`

**Files:**
- Modify: `backend/src/projects/project.service.ts`

- [ ] **Step 1: Replace the three remaining stubs**

In `backend/src/projects/project.service.ts`, replace `getProjects`, `getProjectById`, and `_mapToDto`:

```typescript
async getProjects(userId: string): Promise<ProjectResponseDto[]> {
  const projects = await this.prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { outputs: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });
  return projects.map((p) => this._mapToDto(p));
}

async getProjectById(
  projectId: string,
  userId: string,
): Promise<ProjectResponseDto> {
  const project = await this.prisma.project.findUnique({
    where: { id: projectId },
    include: { outputs: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });
  if (!project || project.userId !== userId) {
    throw new NotFoundException(`Project ${projectId} not found`);
  }
  return this._mapToDto(project);
}

private _mapToDto(project: any): ProjectResponseDto {
  const output = project.outputs?.[0] ?? null;
  return {
    id: project.id,
    title: project.title,
    style: project.style,
    duration: project.duration,
    status: project.status,
    createdAt: project.createdAt,
    output: output
      ? {
          videoUrl: output.videoUrl ?? '',
          audioUrl: output.audioUrl ?? null,
          images: output.images ?? [],
          script: output.script ?? null,
          duration: output.duration ?? null,
        }
      : null,
  };
}
```

- [ ] **Step 2: Run all ProjectService tests — verify all 9 pass**

```
cd backend && npx jest src/projects/project.service.spec.ts --no-coverage
```

Expected: 9 tests pass

- [ ] **Step 3: Commit**

```bash
git add backend/src/projects/project.service.ts
git commit -m "feat(projects): implement getProjects and getProjectById"
```

---

## Task 4: `ProjectController` + `ProjectModule`

**Files:**
- Create: `backend/src/projects/project.controller.spec.ts`
- Create: `backend/src/projects/project.controller.ts`
- Create: `backend/src/projects/project.module.ts`

- [ ] **Step 1: Write the failing controller tests**

Create `backend/src/projects/project.controller.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

describe('ProjectController', () => {
  let controller: ProjectController;
  let serviceMock: { getProjects: jest.Mock; getProjectById: jest.Mock };

  beforeEach(async () => {
    serviceMock = {
      getProjects: jest.fn().mockResolvedValue([]),
      getProjectById: jest.fn().mockResolvedValue({ id: 'proj-1', title: 'Story #1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [{ provide: ProjectService, useValue: serviceMock }],
    }).compile();

    controller = module.get<ProjectController>(ProjectController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProjects', () => {
    it('delegates to ProjectService with userId from JWT', async () => {
      const result = await controller.getProjects({ sub: 'user-1' });
      expect(result).toEqual([]);
      expect(serviceMock.getProjects).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getProjectById', () => {
    it('delegates to ProjectService with id and userId from JWT', async () => {
      const result = await controller.getProjectById({ sub: 'user-1' }, 'proj-1');
      expect(result).toMatchObject({ id: 'proj-1' });
      expect(serviceMock.getProjectById).toHaveBeenCalledWith('proj-1', 'user-1');
    });
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```
cd backend && npx jest src/projects/project.controller.spec.ts --no-coverage
```

Expected: FAIL — `ProjectController` does not exist yet

- [ ] **Step 3: Create `ProjectController`**

Create `backend/src/projects/project.controller.ts`:

```typescript
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/auth/jwt.guard';
import { CurrentUser } from '@/common/auth/current-user.decorator';
import { ProjectService } from './project.service';
import { ProjectResponseDto } from './dto/project-response.dto';

@ApiTags('Projects')
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  @SkipThrottle()
  @ApiOperation({ summary: 'List user projects' })
  @ApiResponse({ status: 200, description: 'Projects retrieved' })
  async getProjects(@CurrentUser() user: any): Promise<ProjectResponseDto[]> {
    return this.projectService.getProjects(user.sub);
  }

  @Get(':id')
  @SkipThrottle()
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiResponse({ status: 200, description: 'Project retrieved' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getProjectById(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<ProjectResponseDto> {
    return this.projectService.getProjectById(id, user.sub);
  }
}
```

- [ ] **Step 4: Create `ProjectModule`**

Create `backend/src/projects/project.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
```

- [ ] **Step 5: Run controller tests — verify all 3 pass**

```
cd backend && npx jest src/projects/project.controller.spec.ts --no-coverage
```

Expected: 3 tests pass

- [ ] **Step 6: Commit**

```bash
git add backend/src/projects/project.controller.ts backend/src/projects/project.controller.spec.ts backend/src/projects/project.module.ts
git commit -m "feat(projects): add ProjectController and ProjectModule"
```

---

## Task 5: Wire modules + add job metadata

**Files:**
- Modify: `backend/src/app.module.ts`
- Modify: `backend/src/generate/generate.module.ts`
- Modify: `backend/src/generate/generate.service.ts`

- [ ] **Step 1: Import `ProjectModule` into `AppModule`**

In `backend/src/app.module.ts`, add the import and add `ProjectModule` to the `imports` array:

```typescript
import { ProjectModule } from './projects/project.module';

// Inside @Module({ imports: [...] }):
GenerateModule,
ProjectModule,  // add after GenerateModule
```

- [ ] **Step 2: Import `ProjectModule` into `GenerateModule`**

In `backend/src/generate/generate.module.ts`, add the import and update `imports`:

```typescript
import { ProjectModule } from '../projects/project.module';

@Module({
  imports: [
    PrismaModule,
    QueueModule,
    BullModule.registerQueue({ name: 'generation' }),
    ProjectModule,  // add this
  ],
  // ... rest unchanged
})
```

- [ ] **Step 3: Add metadata to images job creation in `GenerateService`**

In `backend/src/generate/generate.service.ts`, find the images job creation (inside `generateImages`, the `this.prisma.job.create` call) and add `metadata`:

```typescript
imageJob = await this.prisma.job.create({
  data: {
    userId,
    projectId: scriptJob.projectId,
    type: 'images',
    status: 'pending',
    progress: 0,
    metadata: JSON.stringify({ scriptId: dto.scriptId, style: dto.style }),
  },
});
```

- [ ] **Step 4: Add metadata to audio job creation in `GenerateService`**

In the same file, find the audio job creation (inside `generateAudio`) and add `metadata`:

```typescript
audioJob = await this.prisma.job.create({
  data: {
    userId,
    projectId: scriptJob.projectId,
    type: 'audio',
    status: 'pending',
    progress: 0,
    metadata: JSON.stringify({ scriptId: dto.scriptId }),
  },
});
```

- [ ] **Step 5: Add metadata to video job creation in `GenerateService`**

In the same file, find the video job creation (inside `generateVideo`) and add `metadata`:

```typescript
videoJob = await this.prisma.job.create({
  data: {
    userId,
    projectId: imageJob.projectId,
    type: 'video',
    status: 'pending',
    progress: 0,
    metadata: JSON.stringify({ imageJobId: dto.imageJobId, audioJobId: dto.audioJobId }),
  },
});
```

- [ ] **Step 6: Run all tests — verify nothing is broken**

```
cd backend && npx jest --no-coverage
```

Expected: all existing tests pass, plus the 12 new ProjectService and ProjectController tests

- [ ] **Step 7: Commit**

```bash
git add backend/src/app.module.ts backend/src/generate/generate.module.ts backend/src/generate/generate.service.ts
git commit -m "feat(projects): wire ProjectModule and store job lineage metadata on images/audio/video jobs"
```

---

## Task 6: Queue processor integration

**Files:**
- Modify: `backend/src/generate/generate.queue.processor.ts`

- [ ] **Step 1: Inject `ProjectService` into the queue processor**

In `backend/src/generate/generate.queue.processor.ts`, add the import and update the constructor:

```typescript
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { GenerateService } from './generate.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { ProjectService } from '../projects/project.service';

// ...

@Processor('generation')
export class GenerateQueueProcessor {
  private readonly logger = new Logger(GenerateQueueProcessor.name);

  constructor(
    private prisma: PrismaService,
    private generateService: GenerateService,
    private projectService: ProjectService,
  ) {
    this.logger.log('✅ Queue processor initialized for "generation" queue');
  }
```

- [ ] **Step 2: Call `finalizeFromVideoJob` after video job is marked completed**

In the same file, locate the block inside `processGenerationJob` that calls `this.prisma.job.update` to mark the job `completed` (around line 110). Immediately after that `await`, add the finalization block:

```typescript
      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          progress: 100,
          result: JSON.stringify(result),
          processingTimeMs: executionTimeMs,
          completedAt: new Date(),
        },
      });

      // Finalize project when video completes
      if (type === 'video') {
        const videoUrl = (result as { videoUrl?: string })?.videoUrl;
        if (videoUrl) {
          try {
            await this.projectService.finalizeFromVideoJob(jobId, userId, videoUrl);
            this.logger.log(`[VIDEO] ✅ Project finalized for job ${jobId}`);
          } catch (err) {
            this.logger.warn(
              `[VIDEO] ⚠️  Project finalization failed for job ${jobId}: ${err}`,
            );
          }
        }
      }
```

- [ ] **Step 3: Run all tests — verify they pass**

```
cd backend && npx jest --no-coverage
```

Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add backend/src/generate/generate.queue.processor.ts
git commit -m "feat(projects): finalize project from queue processor on video completion"
```
