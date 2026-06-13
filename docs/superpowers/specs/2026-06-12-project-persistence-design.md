# Project Persistence Design

**Date:** 2026-06-12
**Status:** Approved

## Goal

When a video generation job completes, automatically create a `Project` record and an `Output` record that tie together the story text, style, script, images, audio URL, and video URL. Expose a `GET /projects` endpoint so the frontend can list a user's completed projects.

## Context

The Prisma schema already defines `Project`, `Job`, and `Output` models. Every `Job` has an optional `projectId` field. Currently `projectId` is always `null` — no code populates it. The `Output` table is also never written to. This feature wires them up.

## Decision: Project created at video completion

The `Project` is created only after the video job completes successfully. This avoids orphaned records from abandoned mid-flow sessions.

The project title is auto-generated as `"Story #N"` where N = user's existing project count + 1.

## Data Flow

Generation chain: `script job` → `images job` → `audio job` → `video job`

To trace this chain from the DB at video completion, each job must store upstream references in its `metadata` JSON field when created:

| Job type | `metadata` stored at creation |
|----------|-------------------------------|
| `images` | `{ scriptId, style }` |
| `audio`  | `{ scriptId }` |
| `video`  | `{ imageJobId, audioJobId }` |

At video completion, `ProjectService.finalizeFromVideoJob` uses these references to gather all assets and create the records.

## Data Model

No new Prisma models. The existing schema is used as-is.

**`Project` fields populated:**
- `userId` — from the video job
- `title` — `"Story #N"` (user's project count + 1)
- `storyText` — from script job `metadata.story`
- `style` — from image job `metadata.style`
- `duration` — from script job `metadata.targetDuration`
- `status` — `"completed"`

**`Output` fields populated:**
- `projectId` — newly created project
- `script` — from script job `result.script`
- `images[]` — from image job `result.imageUrls`
- `audioUrl` — from audio job `result.audioUrl`
- `videoUrl` — from video assembly result
- `duration` — from audio job `result.audioLength`
- `format` — `"mp4"`
- `resolution` — `"1080x1920"`

All four jobs (`script`, `images`, `audio`, `video`) get `projectId` back-filled in the same transaction.

## Architecture

### New module: `backend/src/projects/`

```
backend/src/projects/
  project.module.ts
  project.service.ts
  project.controller.ts
  dto/
    project-response.dto.ts
```

`ProjectModule` imports `PrismaModule`. It is imported by `AppModule` and by `GenerateModule` (so the queue processor can inject `ProjectService`).

### `ProjectService`

**`finalizeFromVideoJob(videoJobId: string, userId: string, videoUrl: string): Promise<void>`**

Steps (inside a `prisma.$transaction`):
1. Load video job — if `videoJob.projectId` is already set, return early (idempotency guard against Bull retries)
2. Parse video job metadata → `{ imageJobId, audioJobId }`
3. Load image job + metadata → `{ scriptId, style }` + result `imageUrls[]`
4. Load audio job result → `{ audioUrl, audioLength }`
5. Load script job metadata → `{ story, targetDuration }` + result `script`
6. Count user's existing projects → derive title `"Story #N"`
7. Create `Project`
8. Create `Output` linked to project
9. Update `projectId` on all four jobs

**`getProjects(userId: string): Promise<ProjectResponseDto[]>`**

Fetches all projects for the user ordered by `createdAt DESC`, each with its `outputs` included. Returns mapped DTOs.

**`getProjectById(projectId: string, userId: string): Promise<ProjectResponseDto>`**

Fetches a single project. Throws `NotFoundException` if not found or doesn't belong to user.

### `ProjectController`

```
GET /projects        → getProjects(userId)
GET /projects/:id    → getProjectById(id, userId)
```

Both routes protected with `@UseGuards(JwtAuthGuard)`.

### `ProjectResponseDto`

Fields: `id`, `title`, `style`, `duration`, `status`, `createdAt`, `output` (nested: `videoUrl`, `audioUrl`, `images[]`, `script`, `duration`).

### Queue processor change

In `generate.queue.processor.ts`, after marking the video job `completed`:

```ts
if (type === 'video' && result?.videoUrl) {
  try {
    await this.projectService.finalizeFromVideoJob(jobId, userId, result.videoUrl);
  } catch (err) {
    this.logger.warn(`[VIDEO] Project finalization failed for job ${jobId}: ${err}`);
  }
}
```

A finalization failure does **not** re-throw — the job remains `completed` and the video URL is accessible via `GET /generate/job/:jobId`.

### `GenerateService` changes

When creating `images`, `audio`, and `video` jobs, populate the `metadata` field:

- `images` job: `metadata: JSON.stringify({ scriptId: dto.scriptId, style: dto.style })`
- `audio` job: `metadata: JSON.stringify({ scriptId: dto.scriptId })`
- `video` job: `metadata: JSON.stringify({ imageJobId: dto.imageJobId, audioJobId: dto.audioJobId })`

## Error Handling

- `finalizeFromVideoJob` is fire-and-forget from the queue processor's perspective. Errors are logged as warnings.
- Idempotent: if `videoJob.projectId` is already set, the method returns early — safe against Bull job retries.
- If any upstream job is missing or has no result, the method throws internally, caught by the processor wrapper.
- `getProjects` returns `[]` (not 404) when the user has no projects.
- `getProjectById` throws `NotFoundException` for unknown or unauthorized projects.

## Testing

| File | Coverage |
|------|----------|
| `project.service.spec.ts` | `finalizeFromVideoJob` happy path; missing image job; missing script job; `getProjects` empty list; `getProjects` populated list |
| `project.controller.spec.ts` | `GET /projects` returns 200; `GET /projects/:id` returns 200; auth guard is applied |

Existing generate tests are unaffected. The queue processor change is a single try/catch block.
