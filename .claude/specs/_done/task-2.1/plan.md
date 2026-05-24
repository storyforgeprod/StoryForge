# Task 2.1 — Implementation Plan

## Approach
Inject PrismaService into GenerateService constructor. Wrap each Claude API call with Job lifecycle: create → call → update. Expose a read endpoint for job polling.

## Files modified
| File | Change |
|------|--------|
| `backend/src/generate/generate.service.ts` | +PrismaService injection, Job create/update, getJobStatus() |
| `backend/src/generate/generate.controller.ts` | +JwtAuthGuard, @CurrentUser, GET /job/:jobId, ApiBearerAuth |
| `backend/src/generate/generate.module.ts` | +PrismaModule, AuthModule imports |
| `backend/prisma/schema.prisma` | projectId made optional on Job |

## Key patterns
- Job created with `status: 'processing', progress: 10` before API call
- Job updated with `status: 'completed', progress: 100, result, processingTimeMs, completedAt` on success
- Job updated with `status: 'failed', error` on exception
- userId check in getJobStatus prevents cross-user access
