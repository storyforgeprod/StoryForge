# Task 2.3 — Implementation Plan

## Approach
Create `GenerateQueueProcessor` with `@Processor('generation')` and `@Process()` decorators. Refactor `generateScript()` to create Job(pending) + enqueue rather than calling Claude synchronously. Extract `generateScriptContent()` as the actual Claude-calling method used by the processor.

## Files modified
| File | Change |
|------|--------|
| `backend/src/generate/generate.queue.processor.ts` | NEW — @Processor class with switch on job.data.type |
| `backend/src/generate/generate.service.ts` | Refactored generateScript() to async; added generateScriptContent() |
| `backend/src/generate/generate.module.ts` | +BullModule.registerQueue, +GenerateQueueProcessor provider |
| `backend/src/main.ts` | Initialize queue processor on bootstrap |

## Key patterns
- `@Processor('generation')` on processor class — must match queue name in QueueService
- Processor calls `generateService.generateScriptContent()` (private content method), not `generateScript()` (public endpoint method)
- Job lifecycle managed in processor: update progress 25% → execute → update 100%/failed
- Re-throw errors from processor so Bull can handle retry logic
