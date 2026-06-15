# Task 2.5 — Implementation Plan

## Approach
Same async queue pattern as Tasks 2.3-2.4. ElevenLabsService uses Node fetch (Node 18+) to call the TTS endpoint, returns base64 audio data URL. Add audio case to queue processor switch.

## Files modified
| File | Change |
|------|--------|
| `backend/src/integrations/elevenlabs.service.ts` | Implement generateAudio() with fetch to ElevenLabs v1 API |
| `backend/src/generate/dto/generate-audio.dto.ts` | GenerateAudioDto, GenerateAudioResponseDto, AudioGenerationResult |
| `backend/src/generate/generate.service.ts` | +generateAudio() (endpoint), +generateAudioContent() (processor) |
| `backend/src/generate/generate.queue.processor.ts` | +audio case in switch |
| `backend/src/common/queue/queue.service.ts` | +voiceId field to GenerationJobData |

## Key patterns
- ElevenLabsService uses native fetch (no SDK dependency)
- Default voice: EXAVITQu4vr4xnSDxMaL (Sarah)
- Audio returned as base64 data URI (production: upload to storage)
- generateAudioContent() validates scriptJob.status === 'completed' before calling ElevenLabs
