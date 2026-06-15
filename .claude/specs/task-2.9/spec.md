# Task 2.9: Migración a Azure AI Foundry — Spec

**ID:** Task 2.9  
**Title:** Migrar integraciones de IA desde Claude y Replicate hacia Azure AI Foundry  
**Status:** Ready for implementation  
**Updated:** May 21, 2026

---

## 📋 Refined User Story

### Persona
Backend engineering team responsible for AI integrations and API reliability.

### Current State
The system generates stories and images via:
- **Claude API** → `POST /generate/script` (narrative generation)
- **Replicate** → `POST /generate/images` (image generation)

### Desired State
Migrate completely to **Azure AI Foundry**:
- **GPT-4.1** → narrative generation (Claude replacement)
- **Flux.2-pro** → image generation (Replicate replacement)

### Why (Business Value)
- **Licensing alignment:** Educational project with Azure AD licenses; Claude and Replicate cannot be used going forward
- **Unified infrastructure:** Single provider reduces operational complexity
- **Simplified auth:** Centralized Azure endpoint + API key management
- **Maintainability:** Reduces external dependency fragmentation

### Key Constraints
- ✅ Endpoints and keys already deployed (Azure Foundry)
- ❌ No fallback to Claude or Replicate (licenses unavailable)
- ✅ Must maintain existing HTTP contracts for frontend
- ✅ Must preserve Bull Queue, Prisma, Supabase integration
- ✅ Explicit error handling if Foundry endpoint fails

---

## ✅ Acceptance Criteria (EARS Format)

### Narrative Generation (GPT-4.1)

**AC-1:** When a user calls `POST /generate/script` with valid story text, the system shall generate a narrative script using Azure AI Foundry GPT-4.1 and return the same response schema as before.

**AC-2:** The system shall queue script generation jobs using Bull Queue (existing behavior preserved).

**AC-3:** If the Azure Foundry GPT-4.1 endpoint is unreachable or returns an error, the system shall return a 5xx error with a clear error message and log the failure.

**AC-4:** All Claude API dependencies and imports shall be removed from the codebase (no fallback).

### Image Generation (Flux.2-pro)

**AC-5:** When a user calls `POST /generate/images` with a valid scene prompt, the system shall generate images using Azure AI Foundry Flux.2-pro.

**AC-6:** Generated images shall be stored in Supabase Storage with the same path structure and accessibility as before.

**AC-7:** The response schema for `POST /generate/images` shall remain unchanged for frontend compatibility.

**AC-8:** If the Azure Foundry Flux.2-pro endpoint fails, the system shall return a 5xx error with a clear message and log the failure.

**AC-9:** All Replicate API dependencies and SDK imports shall be removed from the codebase.

### Infrastructure & Config

**AC-10:** All AI provider configuration shall be sourced from `.env.local` with keys:
- `AZURE_OPENAI_ENDPOINT` (GPT-4.1)
- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_DEPLOYMENT_GPT41`
- `AZURE_OPENAI_API_VERSION`
- `AZURE_FOUNDRY_IMAGE_ENDPOINT` (Flux.2-pro)
- `AZURE_FOUNDRY_IMAGE_API_KEY`
- `AZURE_FOUNDRY_FLUX_DEPLOYMENT`

**AC-11:** Rate limiting configuration shall remain unchanged: `RATE_LIMIT_WINDOW_MS=60000`, `RATE_LIMIT_MAX_REQUESTS=10`.

**AC-12:** Logs shall include Azure Foundry request/response metadata (deployment, model, latency).

### Testing & Validation

**AC-13:** Unit tests shall verify that script and image generation produce correctly-formatted responses matching the existing schemas.

**AC-14:** Integration tests shall confirm that Bull Queue jobs are created and processed with Azure Foundry backends.

**AC-15:** E2E tests shall confirm that frontend endpoints (`/generate/script`, `/generate/images`) continue to work without modification.

---

## 🔒 Out of Scope

- ❌ Performance optimization or response time tuning
- ❌ Comparison or quality evaluation of Claude vs GPT-4.1 output
- ❌ Fallback mechanisms to other providers
- ❌ Frontend code modifications
- ❌ Supabase schema or storage structure changes
- ❌ Rate limiting algorithm tuning

---

## 📌 Assumptions

1. ✅ Azure Foundry endpoints (GPT-4.1 + Flux.2-pro) are already deployed and credentials are available
2. ✅ Azure credentials are valid and have the necessary quotas
3. ✅ The team will remove Claude and Replicate from `package.json` dependencies after migration
4. ✅ Explicit 5xx errors are acceptable if Foundry is unavailable (no graceful degradation)
5. ✅ Response format and schema of generated scripts/images do not need to change

---

## ❓ Open Questions

- **Deployment timeline:** When do Claude and Replicate licenses expire?
- **Monitoring:** Should we add Azure Monitor alerts for Foundry API errors?
- **Cost tracking:** Is there a cost allocation model for Azure AI Foundry usage?

---

## 📚 References

- **Current implementation:** `backend/src/integrations/` (replicate.service.ts, elevenlabs.service.ts)
- **Endpoints:** `backend/src/generate/generate.controller.ts`
- **Queue:** `backend/src/common/queue/`
- **.env config:** `backend/.env.example`
