# Design: Azure OpenAI TTS + Voice Selection

**Date:** 2026-06-12
**Status:** Approved

## Summary

Replace ElevenLabs with Azure OpenAI `gpt-4o-mini-tts` as the primary TTS provider. ElevenLabs is removed entirely. The fallback chain is Azure TTS → Azure Speech SDK. Update the frontend `VoiceStep` to display the 6 real Azure voices with MP3 preview files pre-generated and committed to the repo.

---

## Architecture

### Provider chain

```
AudioGenerationService.generateTextToSpeech(text, voiceId)
  Plan A → AzureTTSService      (gpt-4o-mini-tts, voiceId passed directly)
  Plan B → Azure Speech SDK     (fixed voice, unchanged)
```

If both fail, throws `'Servicio de Text-to-Speech no disponible temporalmente.'`

---

## Backend

### New: `AzureTTSService`

**File:** `backend/src/integrations/azure-tts.service.ts`

Calls the Azure OpenAI audio/speech endpoint:

```
POST {AZURE_OPENAI_ENDPOINT}/openai/deployments/{AZURE_OPENAI_DEPLOYMENT_TTS}/audio/speech
     ?api-version={AZURE_OPENAI_API_VERSION}
```

**Request body:**
```json
{ "model": "gpt-4o-mini-tts", "input": "<text>", "voice": "<voiceId>", "response_format": "mp3" }
```

**Response:** Binary MP3 → returned as `data:audio/mpeg;base64,<base64>`

**Env vars used:**
- `AZURE_OPENAI_ENDPOINT` (existing)
- `AZURE_OPENAI_API_KEY` (existing)
- `AZURE_OPENAI_API_VERSION` (existing)
- `AZURE_OPENAI_DEPLOYMENT_TTS` (new, value: `gpt-4o-mini-tts`)

Logs a startup warning if `AZURE_OPENAI_DEPLOYMENT_TTS` is not set. Throws on empty text or API error.

### Updated: `AudioGenerationService`

- Remove `ElevenLabsService` dependency entirely
- Inject `AzureTTSService` as Plan A
- Keep `generateWithAzureSpeechNativo` as Plan B (unchanged)
- Remove `AZURE_TO_ELEVENLABS` voice map (no longer needed)

### Updated: Generate module

- Remove `ElevenLabsService` from providers
- Add `AzureTTSService` as provider

---

## Frontend

### Updated: `VoiceStep`

Replace the `VOICES` constant with the 6 real Azure voices:

| voiceId  | Name    | Tag        | Description                              |
|----------|---------|------------|------------------------------------------|
| alloy    | Alloy   | Balanced   | Clear, neutral — works for any genre     |
| echo     | Echo    | Cinematic  | Deep, measured — epic story narrator     |
| fable    | Fable   | Expressive | Warm storyteller, slight dramatic flair  |
| onyx     | Onyx    | Deep       | Rich, authoritative, commanding          |
| nova     | Nova    | Energetic  | Bright, fast-paced — hooks and action    |
| shimmer  | Shimmer | Soft       | Gentle, intimate, ASMR-adjacent          |

Audio preview elements continue to reference `src="/voices/{id}.mp3"` — no logic changes.

### Updated: `VoiceStep.test.tsx`

Update voice IDs and names in existing test assertions.

---

## MP3 Preview Generation

**Script:** `scripts/generate-voice-previews.mjs`

- Runs once manually: `node scripts/generate-voice-previews.mjs`
- Reads `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_API_VERSION`, `AZURE_OPENAI_DEPLOYMENT_TTS` from `backend/.env.local`
- Calls Azure OpenAI TTS for each of the 6 voices with a fixed preview text (~15 words)
- Saves output to `frontend/public/voices/{voiceId}.mp3`
- Generated files are committed to the repo and served as static assets

**Preview text:** `"Hi, I'll be narrating your story today. Let's dive in."`

---

## Tests

| File | What it tests |
|------|---------------|
| `azure-tts.service.spec.ts` | Happy path, empty text error, API HTTP error (fetch mock) |
| `audio-generation.service.spec.ts` | Plan A success, Plan A fails → Plan B (Azure Speech) activates, both fail → throws |

---

## Files Changed

| Action   | File |
|----------|------|
| Create   | `backend/src/integrations/azure-tts.service.ts` |
| Create   | `backend/src/integrations/azure-tts.service.spec.ts` |
| Create   | `scripts/generate-voice-previews.mjs` |
| Modify   | `backend/src/integrations/audio-generation.service.ts` |
| Modify   | `backend/src/generate/generate.module.ts` |
| Modify   | `frontend/src/features/generation/components/VoiceStep.tsx` |
| Modify   | `frontend/src/features/generation/components/VoiceStep.test.tsx` |
| Add      | `AZURE_OPENAI_DEPLOYMENT_TTS=gpt-4o-mini-tts` in `backend/.env.local` |
