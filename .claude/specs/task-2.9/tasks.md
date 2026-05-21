# Task 2.9: Migración a Azure AI Foundry — Tasks

**Status:** Ready to implement  
**Total Size:** ~4 days (M+M+L+M+S+S)  
**Last updated:** May 21, 2026

---

## 🗂️ Task Breakdown

All tasks ordered by dependency: Environment → Services → Controllers → Tests → Cleanup.

---

### ✅ Task 2.9.1: Setup Azure Foundry Credentials & Environment Variables

**Size:** S (0.5 days)  
**Dependencies:** None  
**Assignee:** Backend dev  

**Description:**
Update `.env.example` with new Azure variables and document configuration.

**Inputs:**
- Azure Foundry endpoints (provided by cloud team)
- Deployment names (GPT-4.1, Flux.2-pro)
- API keys and versions

**Outputs:**
- Updated `backend/.env.example` with 7 new vars
- Updated `backend/.env.local` with test credentials
- Documentation in `HANDOFF.md`

**Done Criteria:**
- [ ] `.env.example` includes all `AZURE_*` variables with comments
- [ ] `.env.local` filled with valid test credentials (not committed)
- [ ] `HANDOFF.md` explains where to source each credential
- [ ] No `ANTHROPIC_API_KEY` or `REPLICATE_API_TOKEN` used going forward

**Testing:**
```bash
npm run start:dev
# Should load Azure vars without errors
```

---

### ✅ Task 2.9.2: Create AzureOpenAIService (GPT-4.1 Integration)

**Size:** M (2 days)  
**Dependencies:** Task 2.9.1  
**Assignee:** Backend dev  

**Description:**
Implement a new service that wraps Azure OpenAI SDK and handles GPT-4.1 calls for narrative generation.

**Inputs:**
- Azure OpenAI SDK (`@azure/openai`)
- Environment variables (endpoint, API key, deployment, version)
- Prompt structure from current Claude implementation

**Outputs:**
- New file: `backend/src/integrations/azure-openai.service.ts`
- Dependency injection in `GenerateModule`

**Done Criteria:**
- [ ] Class `AzureOpenAIService` created with constructor injection of `ConfigService`
- [ ] Method `generateScript(userId: string, story: string): Promise<string>` implemented
- [ ] Reads from environment: `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT_GPT41`, `AZURE_OPENAI_API_VERSION`
- [ ] Throws descriptive errors if endpoint unreachable (no fallback)
- [ ] Logs request details (deployment, latency) and response length
- [ ] Returns plain text script (same format as current Claude output)
- [ ] Unit test with mocked Azure response

**Testing:**
```bash
npm run test -- azure-openai.service.spec.ts
# Should verify: valid response format, error handling, logging
```

---

### ✅ Task 2.9.3: Create AzureFoundryImageService (Flux.2-pro Integration)

**Size:** M (2 days)  
**Dependencies:** Task 2.9.1  
**Assignee:** Backend dev  

**Description:**
Implement a new service that wraps Azure Foundry SDK and handles Flux.2-pro calls for image generation.

**Inputs:**
- Azure Foundry / OpenAI SDK (`@azure/openai`)
- Environment variables (endpoint, API key, deployment)
- Image prompt structure from current Replicate implementation

**Outputs:**
- New file: `backend/src/integrations/azure-foundry-image.service.ts`
- Dependency injection in `GenerateModule`

**Done Criteria:**
- [ ] Class `AzureFoundryImageService` created with constructor injection of `ConfigService`
- [ ] Method `generateImages(userId: string, prompt: string, count: number): Promise<string[]>` implemented
- [ ] Reads from environment: `AZURE_FOUNDRY_IMAGE_ENDPOINT`, `AZURE_FOUNDRY_IMAGE_API_KEY`, `AZURE_FOUNDRY_FLUX_DEPLOYMENT`
- [ ] Throws descriptive errors if endpoint unreachable (no fallback)
- [ ] Logs request details (deployment, latency) and image URLs
- [ ] Returns array of image URLs (same format as Replicate currently)
- [ ] Images stored in Supabase (existing SupabaseService, no changes)
- [ ] Unit test with mocked Azure response

**Testing:**
```bash
npm run test -- azure-foundry-image.service.spec.ts
# Should verify: valid image URLs, error handling, logging
```

---

### ✅ Task 2.9.4: Update GenerateService to Use Azure Providers

**Size:** L (3 days)  
**Dependencies:** Task 2.9.2, Task 2.9.3  
**Assignee:** Backend dev  

**Description:**
Replace Claude and Replicate calls in `GenerateService` with new Azure services.

**Inputs:**
- `GenerateService` current implementation
- New `AzureOpenAIService` and `AzureFoundryImageService`
- Existing `GenerateScriptResponseDto`, `GenerateImagesResponseDto` DTOs

**Outputs:**
- Updated `backend/src/generate/generate.service.ts`
- No changes to request/response contracts

**Changes:**
1. Remove: `import { Anthropic } from '@anthropic-ai/sdk'`
2. Remove: `this.client = new Anthropic(...)`
3. Add dependency injection: `constructor(private azure: AzureOpenAIService, private foundryImage: AzureFoundryImageService, ...)`
4. Update `generateScriptContent()` to call `this.azure.generateScript(userId, story)`
5. Update `generateImagesContent()` to call `this.foundryImage.generateImages(userId, prompt, count)`
6. Ensure error handling: catch errors → throw NestJS BadRequestException with 502 status

**Done Criteria:**
- [ ] No Claude SDK imports remain in `GenerateService`
- [ ] No Replicate imports remain in `GenerateService`
- [ ] All calls route through `AzureOpenAIService` and `AzureFoundryImageService`
- [ ] Response DTOs unchanged (frontend sees same contract)
- [ ] Error messages logged and returned with 502 status
- [ ] All existing tests pass (updated to mock Azure services instead of Claude/Replicate)
- [ ] Integration test confirms queue processor works with new services

**Testing:**
```bash
npm run test -- generate.service.spec.ts
# Should verify: script generation, image generation, error handling, job tracking
```

---

### ✅ Task 2.9.5: Update GenerateQueueProcessor to Use Azure Providers

**Size:** M (2 days)  
**Dependencies:** Task 2.9.4  
**Assignee:** Backend dev  

**Description:**
Update the Bull Queue processor to call Azure services and maintain job state correctly.

**Inputs:**
- `backend/src/generate/generate.queue.processor.ts`
- Updated `GenerateService`

**Outputs:**
- Updated queue processor
- No queue structure changes

**Changes:**
1. Verify `generateScriptContent()` queue handler uses new Azure service
2. Verify `generateImagesContent()` queue handler uses new Azure service
3. Update error handling: catch Azure errors, update job status to "failed", log error
4. Verify progress tracking still works

**Done Criteria:**
- [ ] Queue processor calls `AzureOpenAIService` for scripts
- [ ] Queue processor calls `AzureFoundryImageService` for images
- [ ] Job status updates: "pending" → "processing" → "completed" (or "failed")
- [ ] Latency and error info logged correctly
- [ ] Existing queue integration tests pass

**Testing:**
```bash
npm run test -- generate.queue.processor.spec.ts
# Should verify: job creation, queue processing, status transitions, error handling
```

---

### ✅ Task 2.9.6: Remove Claude and Replicate Dependencies

**Size:** S (1 day)  
**Dependencies:** Task 2.9.4, Task 2.9.5  
**Assignee:** Backend dev  

**Description:**
Clean up package.json, remove unused imports, ensure no dangling references.

**Changes:**
1. `npm uninstall @anthropic-ai/sdk replicate`
2. Delete old `replicate.service.ts` (no longer used)
3. Grep for any remaining Claude/Replicate imports → remove
4. Update `ReplicateService` exports in `generate.module.ts` (remove or keep as unused)

**Done Criteria:**
- [ ] `package.json` no longer has `@anthropic-ai/sdk` or `replicate`
- [ ] `npm run lint` passes (no unused imports)
- [ ] Grep finds zero references to "Anthropic" or "replicate" in src/
- [ ] `npm run build` succeeds
- [ ] Backend starts with no warnings: `npm run start:dev`

**Testing:**
```bash
grep -r "anthropic\|Anthropic\|replicate" backend/src/
# Should return zero results
```

---

### ✅ Task 2.9.7: Validate Response Format Compatibility

**Size:** S (1 day)  
**Dependencies:** Task 2.9.4, Task 2.9.5  
**Assignee:** Backend dev  

**Description:**
Unit tests to confirm GPT-4.1 and Flux.2-pro outputs match existing DTO schemas.

**Inputs:**
- `GenerateScriptResponseDto`, `GenerateImagesResponseDto`
- Sample GPT-4.1 and Flux.2-pro responses

**Outputs:**
- New test file: `backend/src/generate/format-validation.spec.ts`

**Done Criteria:**
- [ ] Test: GPT-4.1 response maps cleanly to `GenerateScriptResponseDto`
- [ ] Test: Flux.2-pro image URLs array matches `GenerateImagesResponseDto`
- [ ] Test: Error responses have status code, message, error fields
- [ ] Test: Latency and token usage logged correctly

**Testing:**
```bash
npm run test -- format-validation.spec.ts
# All tests pass
```

---

### ✅ Task 2.9.8: Integration Test (End-to-End)

**Size:** M (2 days)  
**Dependencies:** All previous tasks  
**Assignee:** Backend dev  

**Description:**
E2E test: call `/generate/script` and `/generate/images` endpoints with real Azure Foundry credentials (or mocked).

**Inputs:**
- Running backend on `localhost:3000`
- Azure credentials in `.env.local`
- Test fixtures (sample story, image prompts)

**Outputs:**
- Test file: `backend/src/generate/generate.e2e.spec.ts`

**Done Criteria:**
- [ ] `POST /generate/script` returns 200 with jobId and status "pending"
- [ ] `POST /generate/images` returns 200 with jobId and status "pending"
- [ ] Bull Queue picks up jobs and processes them
- [ ] Job status updates to "completed" with result or "failed" with error
- [ ] Script result is valid string (not empty)
- [ ] Image URLs are valid HTTP/HTTPS URLs
- [ ] Frontend can call both endpoints without modification
- [ ] Error case: if endpoint down, returns 502

**Testing:**
```bash
npm run test:e2e -- generate.e2e.spec.ts
```

---

### ✅ Task 2.9.9: Documentation & Handoff

**Size:** S (0.5 days)  
**Dependencies:** All previous tasks  
**Assignee:** Backend dev  

**Description:**
Update README, HANDOFF.md, and comments.

**Outputs:**
- Updated `backend/README.md` (Azure Foundry setup instructions)
- Updated `HANDOFF.md` (Azure credentials and migration notes)
- Code comments in new services

**Done Criteria:**
- [ ] `README.md` explains how to obtain Azure credentials
- [ ] `HANDOFF.md` lists all `AZURE_*` environment variables
- [ ] `HANDOFF.md` notes that Claude and Replicate are fully replaced
- [ ] Each service file has header comment explaining purpose
- [ ] No dangling TODOs or FIXMEs

---

## 📊 Summary

| Task         | Size | Days | Status |
|------------- |------|------|--------|
| 2.9.1 Setup    | S    | 0.5  | Ready  |
| 2.9.2 GPT-4.1  | M    | 2    | Ready  |
| 2.9.3 Flux     | M    | 2    | Ready  |
| 2.9.4 Service  | L    | 3    | Ready  |
| 2.9.5 Queue    | M    | 2    | Ready  |
| 2.9.6 Cleanup  | S    | 1    | Ready  |
| 2.9.7 Format   | S    | 1    | Ready  |
| 2.9.8 E2E      | M    | 2    | Ready  |
| 2.9.9 Docs     | S    | 0.5  | Ready  |
|              |      | ~14  | **Total** |

---

## 🎯 Implementation Notes

### Parallel Work
- Tasks 1.2 and 1.3 can be done in parallel (independent)
- Task 1.4 requires both 1.2 and 1.3, but blocks 1.5
- Tasks 1.6–1.9 can happen after 1.4 or 1.5

### Testing Strategy
- **Unit tests:** Mock Azure SDK responses (don't call real endpoints during CI)
- **Local E2E:** Call real Azure Foundry endpoints with test credentials
- **Before merge:** All unit tests pass + manual E2E on staging env

### Risk Mitigation
- ✅ No schema changes → minimal migration risk
- ✅ Response format validation ensures frontend compatibility
- ✅ New services isolated → existing code untouched until GenerateService
- ✅ Explicit errors → no silent failures

---

## ✨ Acceptance Checklist (For QA/Review)

Before closing HU-IA-07:
- [ ] All 9 tasks marked complete
- [ ] `/generate/script` returns scripts via Azure GPT-4.1
- [ ] `/generate/images` returns image URLs via Azure Flux.2-pro
- [ ] No requests sent to Claude API or Replicate API
- [ ] Frontend works unchanged
- [ ] All tests pass (unit + integration + E2E)
- [ ] Documentation updated
- [ ] Claude and Replicate SDKs removed from dependencies
