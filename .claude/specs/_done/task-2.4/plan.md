# Task 2.4 — Implementation Plan

## Approach
Follow exact same async queue pattern as Task 2.3 (script). Implement ReplicateService stub, add generateImages()/generateImageContent() to GenerateService, add images case to queue processor switch.

## Files modified
| File | Change |
|------|--------|
| `backend/src/integrations/replicate.service.ts` | Implement generateImage() using Replicate SDK + flux-pro model |
| `backend/src/generate/dto/generate-images.dto.ts` | GenerateImagesDto, GenerateImagesResponseDto, ImageGenerationResult |
| `backend/src/generate/generate.service.ts` | +generateImages() (endpoint method), +generateImageContent() (processor method) |
| `backend/src/generate/generate.queue.processor.ts` | +images case in switch |
| `backend/src/common/queue/queue.service.ts` | +scriptId, imageDescription fields to GenerationJobData |

## Key patterns
- generateImageContent() fetches scriptJob.result, calls Claude to build image prompt, then calls ReplicateService
- ReplicateService returns array of image URLs
- Same pending → processing → completed lifecycle as script jobs
