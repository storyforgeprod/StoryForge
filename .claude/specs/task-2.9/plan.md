# Task 2.9: Migración a Azure AI Foundry — Plan

**Status:** Architecture design ready  
**Last updated:** May 21, 2026

---

## 🏛️ Architecture Overview

### Current State (Claude + Replicate)

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │
       ├──────────────────────────────┬──────────────────────────┐
       │                              │                          │
  /generate/script              /generate/images          /generate/audio
       │                              │                          │
       ▼                              ▼                          ▼
┌─────────────────────┐      ┌──────────────────┐      ┌──────────────┐
│ GenerateService     │      │ GenerateService  │      │ ElevenLabs   │
│ (Claude via SDK)    │      │ (Replicate SDK)  │      │ Integration  │
└──────────┬──────────┘      └────────┬─────────┘      └──────────────┘
           │                          │
           ▼                          ▼
    ┌─────────────┐            ┌──────────────┐
    │ Bull Queue  │            │ Supabase     │
    │ (jobs)      │            │ Storage      │
    └─────────────┘            └──────────────┘
```

### Target State (Azure AI Foundry)

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │
       ├──────────────────────────────┬──────────────────────────┐
       │                              │                          │
  /generate/script              /generate/images          /generate/audio
       │                              │                          │
       ▼                              ▼                          ▼
┌─────────────────────┐      ┌──────────────────┐      ┌──────────────┐
│ GenerateService     │      │ GenerateService  │      │ ElevenLabs   │
│ (AI Provider Layer) │      │ (AI Provider)    │      │ Integration  │
└──────────┬──────────┘      └────────┬─────────┘      └──────────────┘
           │                          │
    ┌──────▼──────────┐        ┌──────▼─────────────┐
    │ AzureOpenAI     │        │ AzureFoundryImage  │
    │ Service         │        │ Service            │
    │ (GPT-4.1)       │        │ (Flux.2-pro)       │
    └──────┬──────────┘        └──────┬─────────────┘
           │                          │
           ▼                          ▼
    ┌─────────────────────────────────────────┐
    │   Azure AI Foundry                      │
    │   ├─ GPT-4.1 (Narrative)               │
    │   └─ Flux.2-pro (Images)               │
    └─────────────────────────────────────────┘
           │                          │
           └──────────────┬───────────┘
                          ▼
                  ┌──────────────┐
                  │ Supabase     │
                  │ Storage      │
                  └──────────────┘
```

---

## 🏗️ Architecture Decision Records (ADRs)

### ADR-1: Provider Abstraction Layer

**Decision:** Create new `AzureOpenAIService` and `AzureFoundryImageService` classes to encapsulate Azure AI Foundry calls.

**Rationale:**
- Decouples business logic (GenerateService) from provider details
- Enables future provider swaps or gradual migration
- Improves testability (mock Azure services in unit tests)
- Reduces cognitive load on GenerateService

**Trade-offs:**
- ✅ Cleaner architecture, easier to test
- ❌ One extra layer of indirection
- ⚖️ Worth it for maintainability

**Implementation:**
- `backend/src/integrations/azure-openai.service.ts` → GPT-4.1 wrapper
- `backend/src/integrations/azure-foundry-image.service.ts` → Flux.2-pro wrapper

---

### ADR-2: Configuration via Environment Variables

**Decision:** All Azure Foundry credentials and endpoints sourced from `.env.local` (no hardcoding, no config server).

**Rationale:**
- Simplicity for local dev and deployment
- Aligns with existing backend patterns (Supabase, Anthropic already use env vars)
- Educational project doesn't warrant complex config management

**Variables:**
```
AZURE_OPENAI_ENDPOINT=https://<region>.openai.azure.com/
AZURE_OPENAI_API_KEY=<key>
AZURE_OPENAI_DEPLOYMENT_GPT41=gpt-4-1-deployment-name
AZURE_OPENAI_API_VERSION=2024-02-15-preview

AZURE_FOUNDRY_IMAGE_ENDPOINT=https://<region>.openai.azure.com/
AZURE_FOUNDRY_IMAGE_API_KEY=<key>
AZURE_FOUNDRY_FLUX_DEPLOYMENT=flux-2-pro-deployment-name
```

---

### ADR-3: No Fallback, Explicit Error

**Decision:** If Azure Foundry fails, return explicit 5xx error. Do NOT fall back to Claude or Replicate.

**Rationale:**
- ✅ No license availability → fallback is impossible anyway
- ✅ Explicit errors are better than silent failures or degraded UX
- ✅ Forces immediate investigation and fixes
- ✅ Cleaner code (no branching logic)

**Implementation:**
- Both services throw `Error` if endpoint is unreachable
- GenerateService catches and re-throws as NestJS exception with HTTP 502/503

---

### ADR-4: Preserve Existing Response Schemas

**Decision:** Do NOT modify `GenerateScriptResponseDto` or `GenerateImagesResponseDto`; GPT-4.1 and Flux.2-pro output must map cleanly to existing schemas.

**Rationale:**
- Frontend needs zero changes
- Reduces risk and testing scope
- If schemas need to change, that's a separate story

**Validation:** Unit tests must verify output format matches

---

## 📊 Data Model Changes

### No Schema Migrations Required

✅ No changes to Prisma schema or Supabase tables.

The `Job` table already stores:
- `jobId` → uniquely identifies each generation request
- `type` → "script" | "images" | "audio" (provider-agnostic)
- `status` → "pending" | "processing" | "completed" | "failed"
- `result` → JSON blob (stores the output)
- `error` → error message if failed

### Job Tracking (Existing, No Changes)

```prisma
model Job {
  id            String    @id @default(cuid())
  userId        String
  projectId     String?
  type          String    // "script", "images", "audio"
  status        String    // "pending", "processing", "completed", "failed"
  progress      Int       @default(0)
  result        String?   // JSON
  error         String?
  processingTimeMs Int?
  createdAt     DateTime  @default(now())
  completedAt   DateTime?
}
```

---

## 🔌 API Contracts

### POST /generate/script

**Request:**
```json
{
  "story": "Once upon a time...",
  "style": "anime"  // optional
}
```

**Response (200 OK):**
```json
{
  "jobId": "clx1a2b3c4d5e6f7g8h9i",
  "status": "pending",
  "message": "Script generation queued",
  "createdAt": "2026-05-21T10:30:00Z"
}
```

**Error (502 Bad Gateway / 503 Service Unavailable):**
```json
{
  "statusCode": 502,
  "message": "Azure OpenAI endpoint unavailable",
  "error": "BadGateway"
}
```

**Provider Change:**
- ✅ No request/response schema change
- ✅ Internal: `GenerateService` → `AzureOpenAIService` (instead of Claude SDK)
- ✅ Response format: GPT-4.1 must produce same structure as Claude

---

### POST /generate/images

**Request:**
```json
{
  "prompt": "A warrior in an anime style",
  "count": 1
}
```

**Response (200 OK):**
```json
{
  "jobId": "clx1a2b3c4d5e6f7g8h9i",
  "status": "pending",
  "message": "Image generation queued",
  "createdAt": "2026-05-21T10:30:00Z"
}
```

**Error (502 Bad Gateway / 503 Service Unavailable):**
```json
{
  "statusCode": 502,
  "message": "Azure Foundry image endpoint unavailable",
  "error": "BadGateway"
}
```

**Provider Change:**
- ✅ No request/response schema change
- ✅ Internal: `GenerateService` → `AzureFoundryImageService` (instead of Replicate SDK)
- ✅ Storage: Images still go to Supabase Storage (same path structure)

---

## 🔐 Security Notes

- ✅ Azure API keys stored in `.env.local` (never committed)
- ✅ Deployment: keys injected via CI/CD secrets or environment injection
- ✅ All Azure calls use standard HTTPS
- ✅ No new RBAC or IAM changes required (Azure CLI or Azure Portal roles already assigned)

---

## 📈 Observability

### Logging

Each service logs:
- ✅ Request payload (sanitized, no secrets)
- ✅ Deployment name and API version
- ✅ Response time (latency)
- ✅ Error details (status, message)

Example:
```
[GenerateService] 🤖 Calling Azure GPT-4.1: gpt-4-1-deployment | latency: 2500ms
[GenerateService] ✅ Generated script (832 tokens)

[AzureFoundryImageService] 🎨 Calling Flux.2-pro: flux-2-pro-deployment | latency: 3200ms
[AzureFoundryImageService] ✅ Generated 1 image URL
```

### Metrics (Future)

- Azure Monitor integration (Azure SDK provides built-in telemetry)
- Track: request count, latency, error rates, token usage

---

## ⚡ Performance Considerations

- ✅ No changes to Bull Queue or job processing
- ✅ Azure Foundry latencies expected similar to Claude/Replicate (~2-3 seconds)
- ✅ Rate limiting unchanged: 10 requests / 60 seconds

---

## 🧪 Testing Strategy

| Layer       | Type          | Coverage                                    |
|-------------|---------------|---------------------------------------------|
| Service     | Unit          | Mocked Azure responses, error handling      |
| Queue       | Integration   | Job creation, Bull Queue processing         |
| Endpoint    | E2E           | POST /generate/script, POST /generate/images |
| Response    | Contract      | Output schema matches existing DTOs         |

