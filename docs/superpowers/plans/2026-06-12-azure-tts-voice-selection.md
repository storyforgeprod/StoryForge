# Azure TTS + Voice Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace ElevenLabs with Azure OpenAI gpt-4o-mini-tts as primary TTS provider and update VoiceStep to show the 6 real Azure voices with pre-generated MP3 previews.

**Architecture:** `AzureTTSService` is a new integration that calls `/openai/deployments/{deployment}/audio/speech`. `AudioGenerationService` is updated to use it as Plan A with Azure Speech SDK as Plan B (ElevenLabs removed). The frontend `VoiceStep` uses the 6 real Azure voice IDs so no server-side mapping is needed.

**Tech Stack:** NestJS + Jest (backend), React + Vitest + Testing Library (frontend), Node ESM script for preview generation.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `backend/src/integrations/azure-tts.service.ts` | Calls Azure OpenAI TTS endpoint |
| Create | `backend/src/integrations/azure-tts.service.spec.ts` | Unit tests for AzureTTSService |
| Create | `backend/src/integrations/audio-generation.service.spec.ts` | Unit tests for AudioGenerationService |
| Modify | `backend/src/integrations/audio-generation.service.ts` | Swap ElevenLabs → AzureTTSService as Plan A |
| Modify | `backend/src/generate/generate.module.ts` | Remove ElevenLabsService, add AzureTTSService |
| Modify | `frontend/src/features/generation/components/VoiceStep.tsx` | Replace VOICES with 6 Azure voices |
| Modify | `frontend/src/features/generation/components/VoiceStep.test.tsx` | Update test assertions |
| Create | `scripts/generate-voice-previews.mjs` | One-time script to generate preview MP3s |
| Add    | `frontend/public/voices/{voice}.mp3` ×6 | Static preview audio files (committed) |

---

## Task 1: Add env var

**Files:**
- Modify: `backend/.env.local`

- [ ] **Step 1: Add the new env var**

Open `backend/.env.local` and add this line:

```
AZURE_OPENAI_DEPLOYMENT_TTS=gpt-4o-mini-tts
```

- [ ] **Step 2: Commit**

```bash
git add backend/.env.local
git commit -m "chore: add AZURE_OPENAI_DEPLOYMENT_TTS env var"
```

---

## Task 2: Create AzureTTSService (TDD)

**Files:**
- Create: `backend/src/integrations/azure-tts.service.spec.ts`
- Create: `backend/src/integrations/azure-tts.service.ts`

- [ ] **Step 1: Write the failing tests**

Create `backend/src/integrations/azure-tts.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AzureTTSService } from './azure-tts.service';

const mockConfig = {
  get: jest.fn((key: string) => {
    switch (key) {
      case 'AZURE_OPENAI_ENDPOINT': return 'https://example.openai.azure.com';
      case 'AZURE_OPENAI_API_KEY': return 'test-key';
      case 'AZURE_OPENAI_API_VERSION': return '2024-05-01-preview';
      case 'AZURE_OPENAI_DEPLOYMENT_TTS': return 'gpt-4o-mini-tts';
      default: return undefined;
    }
  }),
};

describe('AzureTTSService', () => {
  let service: AzureTTSService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AzureTTSService,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AzureTTSService>(AzureTTSService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('returns base64 data URL on success', async () => {
    const fakeBuffer = Buffer.from('fake-mp3-data');
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(fakeBuffer.buffer),
    } as any);

    const result = await service.synthesize('Hello world', 'alloy');

    expect(result).toMatch(/^data:audio\/mpeg;base64,/);
  });

  it('throws on empty text', async () => {
    await expect(service.synthesize('', 'alloy')).rejects.toThrow('Text cannot be empty');
  });

  it('throws on whitespace-only text', async () => {
    await expect(service.synthesize('   ', 'alloy')).rejects.toThrow('Text cannot be empty');
  });

  it('throws on API error response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: () => Promise.resolve('Bad request'),
    } as any);

    await expect(service.synthesize('Hello', 'alloy')).rejects.toThrow('Azure TTS API failed: 400');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend && npx jest azure-tts.service.spec.ts --no-coverage
```

Expected: FAIL — `Cannot find module './azure-tts.service'`

- [ ] **Step 3: Implement AzureTTSService**

Create `backend/src/integrations/azure-tts.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AzureTTSService {
  private readonly logger = new Logger(AzureTTSService.name);
  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly apiVersion: string;
  private readonly deployment: string;

  constructor(private readonly configService: ConfigService) {
    this.endpoint = this.configService.get<string>('AZURE_OPENAI_ENDPOINT', '');
    this.apiKey = this.configService.get<string>('AZURE_OPENAI_API_KEY', '');
    this.apiVersion = this.configService.get<string>('AZURE_OPENAI_API_VERSION', '');
    this.deployment = this.configService.get<string>('AZURE_OPENAI_DEPLOYMENT_TTS', '');

    if (!this.deployment) {
      this.logger.warn('⚠️ AZURE_OPENAI_DEPLOYMENT_TTS not configured. Azure TTS will fail.');
    }
  }

  async synthesize(text: string, voiceId: string): Promise<string> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    const url =
      `${this.endpoint}/openai/deployments/${this.deployment}/audio/speech` +
      `?api-version=${this.apiVersion}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.deployment,
        input: text,
        voice: voiceId,
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Azure TTS API error: ${response.status} - ${error}`);
      throw new Error(`Azure TTS API failed: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(audioBuffer).toString('base64');
    return `data:audio/mpeg;base64,${base64}`;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd backend && npx jest azure-tts.service.spec.ts --no-coverage
```

Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add backend/src/integrations/azure-tts.service.ts backend/src/integrations/azure-tts.service.spec.ts
git commit -m "feat(backend): add AzureTTSService for gpt-4o-mini-tts"
```

---

## Task 3: Update AudioGenerationService (TDD)

**Files:**
- Create: `backend/src/integrations/audio-generation.service.spec.ts`
- Modify: `backend/src/integrations/audio-generation.service.ts`

- [ ] **Step 1: Write the failing tests**

Create `backend/src/integrations/audio-generation.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AudioGenerationService } from './audio-generation.service';
import { AzureTTSService } from './azure-tts.service';

describe('AudioGenerationService', () => {
  let service: AudioGenerationService;
  let azureTTS: jest.Mocked<AzureTTSService>;

  const mockConfigService = {
    get: jest.fn().mockReturnValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AudioGenerationService,
        {
          provide: AzureTTSService,
          useValue: { synthesize: jest.fn() },
        },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AudioGenerationService>(AudioGenerationService);
    azureTTS = module.get(AzureTTSService);
  });

  it('returns audio from Plan A when Azure TTS succeeds', async () => {
    azureTTS.synthesize.mockResolvedValueOnce('data:audio/mpeg;base64,abc123');

    const result = await service.generateTextToSpeech('Hello', 'nova');

    expect(result).toBe('data:audio/mpeg;base64,abc123');
    expect(azureTTS.synthesize).toHaveBeenCalledWith('Hello', 'nova');
  });

  it('defaults to "alloy" voice when voiceId is not provided', async () => {
    azureTTS.synthesize.mockResolvedValueOnce('data:audio/mpeg;base64,abc123');

    await service.generateTextToSpeech('Hello');

    expect(azureTTS.synthesize).toHaveBeenCalledWith('Hello', 'alloy');
  });

  it('throws with user-friendly message when both plans fail', async () => {
    azureTTS.synthesize.mockRejectedValueOnce(new Error('Azure TTS down'));
    // Plan B fails: no AZURE_SPEECH_API_KEY in mockConfigService

    await expect(service.generateTextToSpeech('Hello', 'echo')).rejects.toThrow(
      'Servicio de Text-to-Speech no disponible temporalmente.',
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend && npx jest audio-generation.service.spec.ts --no-coverage
```

Expected: FAIL — tests fail because `AudioGenerationService` still injects `ElevenLabsService`

- [ ] **Step 3: Update AudioGenerationService**

Replace the entire content of `backend/src/integrations/audio-generation.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { AzureTTSService } from './azure-tts.service';

@Injectable()
export class AudioGenerationService {
  private readonly logger = new Logger(AudioGenerationService.name);

  constructor(
    private readonly azureTTSService: AzureTTSService,
    private readonly configService: ConfigService,
  ) {}

  async generateTextToSpeech(text: string, voiceId?: string): Promise<string> {
    const voice = voiceId || 'alloy';

    try {
      this.logger.log('🎙️ [Plan A] Generating audio with Azure TTS...');
      return await this.azureTTSService.synthesize(text, voice);
    } catch (planAError: unknown) {
      const errorMsg = planAError instanceof Error ? planAError.message : String(planAError);
      this.logger.warn(`⚠️ [Plan A] Azure TTS failed: ${errorMsg}. Falling back to Azure Speech...`);

      try {
        return await this.generateWithAzureSpeechNativo(text);
      } catch (azureError: unknown) {
        const azureMsg = azureError instanceof Error ? azureError.message : String(azureError);
        this.logger.error(`❌ [Plan B] Azure Speech also failed: ${azureMsg}`);
        throw new Error('Servicio de Text-to-Speech no disponible temporalmente.');
      }
    }
  }

  private async generateWithAzureSpeechNativo(text: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const apiKey = this.configService.get('AZURE_SPEECH_API_KEY');
      const region = this.configService.get('AZURE_SPEECH_REGION');

      if (!apiKey || !region) {
        reject(
          new Error(
            'Azure Speech credentials not configured (AZURE_SPEECH_API_KEY, AZURE_SPEECH_REGION)',
          ),
        );
        return;
      }

      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(apiKey, region);
      speechConfig.speechSynthesisOutputFormat =
        SpeechSDK.SpeechSynthesisOutputFormat.Audio24Khz160KBitRateMonoMp3;
      speechConfig.speechSynthesisVoiceName = 'es-MX-DaliaNeural';

      const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, null);
      this.logger.log('🔊 [Plan B] Synthesizing with Azure Speech...');

      synthesizer.speakTextAsync(
        text,
        (result: SpeechSDK.SpeechSynthesisResult) => {
          if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
            synthesizer.close();
            const audioBuffer = Buffer.from(result.audioData);
            const base64 = audioBuffer.toString('base64');
            this.logger.log('✅ [Plan B] Audio generated with Azure Speech');
            resolve(`data:audio/mpeg;base64,${base64}`);
          } else {
            synthesizer.close();
            reject(new Error(`Azure Speech failed: ${result.errorDetails || 'Unknown error'}`));
          }
        },
        (error: string) => {
          synthesizer.close();
          reject(new Error(error));
        },
      );
    });
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd backend && npx jest audio-generation.service.spec.ts --no-coverage
```

Expected: PASS — 3 tests passing

- [ ] **Step 5: Commit**

```bash
git add backend/src/integrations/audio-generation.service.ts backend/src/integrations/audio-generation.service.spec.ts
git commit -m "feat(backend): swap ElevenLabs for AzureTTSService as Plan A in AudioGenerationService"
```

---

## Task 4: Update GenerateModule

**Files:**
- Modify: `backend/src/generate/generate.module.ts`

- [ ] **Step 1: Update the module**

Replace the entire content of `backend/src/generate/generate.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { GenerateController } from './generate.controller';
import { GenerateService } from './generate.service';
import { GenerateQueueProcessor } from './generate.queue.processor';
import { PrismaModule } from '../common/prisma/prisma.module';
import { QueueModule } from '../common/queue/queue.module';
import { AzureOpenAIService } from '../integrations/azure-openai.service';
import { AzureFoundryImageService } from '../integrations/azure-foundry-image.service';
import { ImageService } from '../integrations/image.service';
import { AzureTTSService } from '../integrations/azure-tts.service';
import { AudioGenerationService } from '../integrations/audio-generation.service';
import { VideoService } from '../integrations/video.service';

@Module({
  imports: [
    PrismaModule,
    QueueModule,
    BullModule.registerQueue({
      name: 'generation',
    }),
  ],
  controllers: [GenerateController],
  providers: [
    GenerateService,
    GenerateQueueProcessor,
    AzureOpenAIService,
    AzureFoundryImageService,
    ImageService,
    AzureTTSService,
    AudioGenerationService,
    VideoService,
  ],
  exports: [
    GenerateService,
    AzureOpenAIService,
    AzureFoundryImageService,
    ImageService,
    AzureTTSService,
    AudioGenerationService,
    VideoService,
  ],
})
export class GenerateModule {}
```

- [ ] **Step 2: Verify the backend compiles**

```bash
cd backend && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add backend/src/generate/generate.module.ts
git commit -m "feat(backend): register AzureTTSService in GenerateModule, remove ElevenLabsService"
```

---

## Task 5: Update VoiceStep frontend

**Files:**
- Modify: `frontend/src/features/generation/components/VoiceStep.tsx`
- Modify: `frontend/src/features/generation/components/VoiceStep.test.tsx`

- [ ] **Step 1: Write the failing tests**

Replace the entire content of `frontend/src/features/generation/components/VoiceStep.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VoiceStep } from './VoiceStep';

it('renders 6 voice options', () => {
  render(<VoiceStep value={null} onChange={vi.fn()} onContinue={vi.fn()} />);
  expect(screen.getByText('Alloy')).toBeInTheDocument();
  expect(screen.getByText('Echo')).toBeInTheDocument();
  expect(screen.getByText('Fable')).toBeInTheDocument();
  expect(screen.getByText('Onyx')).toBeInTheDocument();
  expect(screen.getByText('Nova')).toBeInTheDocument();
  expect(screen.getByText('Shimmer')).toBeInTheDocument();
});

it('enables Continue button after selection', () => {
  render(<VoiceStep value="echo" onChange={vi.fn()} onContinue={vi.fn()} />);
  expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled();
});

it('disables Continue button when no voice is selected', () => {
  render(<VoiceStep value={null} onChange={vi.fn()} onContinue={vi.fn()} />);
  expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
});

it('calls onChange when a voice is selected', () => {
  const onChange = vi.fn();
  render(<VoiceStep value={null} onChange={onChange} onContinue={vi.fn()} />);
  fireEvent.click(screen.getByLabelText('Alloy'));
  expect(onChange).toHaveBeenCalledWith('alloy');
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npx vitest run src/features/generation/components/VoiceStep.test.tsx
```

Expected: FAIL — `Alloy`, `Echo`, etc. not found (old voice names rendered)

- [ ] **Step 3: Update the VOICES constant in VoiceStep**

In `frontend/src/features/generation/components/VoiceStep.tsx`, replace the `VOICES` array (lines 15–21):

```typescript
const VOICES: VoiceMeta[] = [
  { id: 'alloy',   name: 'Alloy',   tag: 'Balanced',   description: 'Clear, neutral — works for any genre' },
  { id: 'echo',    name: 'Echo',    tag: 'Cinematic',  description: 'Deep, measured — epic story narrator' },
  { id: 'fable',   name: 'Fable',   tag: 'Expressive', description: 'Warm storyteller, slight dramatic flair' },
  { id: 'onyx',    name: 'Onyx',    tag: 'Deep',       description: 'Rich, authoritative, commanding' },
  { id: 'nova',    name: 'Nova',    tag: 'Energetic',  description: 'Bright, fast-paced — hooks and action' },
  { id: 'shimmer', name: 'Shimmer', tag: 'Soft',       description: 'Gentle, intimate, ASMR-adjacent' },
];
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npx vitest run src/features/generation/components/VoiceStep.test.tsx
```

Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/generation/components/VoiceStep.tsx frontend/src/features/generation/components/VoiceStep.test.tsx
git commit -m "feat(frontend): update VoiceStep with 6 real Azure TTS voices"
```

---

## Task 6: Generate and commit voice preview MP3s

**Files:**
- Create: `scripts/generate-voice-previews.mjs`
- Add: `frontend/public/voices/alloy.mp3`, `echo.mp3`, `fable.mp3`, `onyx.mp3`, `nova.mp3`, `shimmer.mp3`

- [ ] **Step 1: Create the generation script**

Create `scripts/generate-voice-previews.mjs`:

```javascript
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function parseEnv(filePath) {
  try {
    return Object.fromEntries(
      readFileSync(filePath, 'utf8')
        .split('\n')
        .filter((line) => line && !line.startsWith('#') && line.includes('='))
        .map((line) => {
          const idx = line.indexOf('=');
          return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
        }),
    );
  } catch {
    return {};
  }
}

const env = { ...parseEnv(resolve(ROOT, 'backend/.env.local')), ...process.env };

const ENDPOINT = env.AZURE_OPENAI_ENDPOINT;
const API_KEY = env.AZURE_OPENAI_API_KEY;
const API_VERSION = env.AZURE_OPENAI_API_VERSION;
const DEPLOYMENT = env.AZURE_OPENAI_DEPLOYMENT_TTS;

if (!ENDPOINT || !API_KEY || !API_VERSION || !DEPLOYMENT) {
  console.error(
    'Missing env vars: AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_API_VERSION, AZURE_OPENAI_DEPLOYMENT_TTS',
  );
  process.exit(1);
}

const VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
const PREVIEW_TEXT = "Hi, I'll be narrating your story today. Let's dive in.";
const OUT_DIR = resolve(ROOT, 'frontend/public/voices');

mkdirSync(OUT_DIR, { recursive: true });

for (const voice of VOICES) {
  console.log(`Generating preview for: ${voice}`);
  const url = `${ENDPOINT}/openai/deployments/${DEPLOYMENT}/audio/speech?api-version=${API_VERSION}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: DEPLOYMENT, input: PREVIEW_TEXT, voice, response_format: 'mp3' }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`  ✗ Failed for ${voice}: ${response.status} - ${error}`);
    continue;
  }

  const buffer = await response.arrayBuffer();
  const outPath = resolve(OUT_DIR, `${voice}.mp3`);
  writeFileSync(outPath, Buffer.from(buffer));
  console.log(`  ✓ Saved ${outPath}`);
}

console.log('Done.');
```

- [ ] **Step 2: Run the script to generate the MP3 files**

```bash
node scripts/generate-voice-previews.mjs
```

Expected output:
```
Generating preview for: alloy
  ✓ Saved .../frontend/public/voices/alloy.mp3
Generating preview for: echo
  ✓ Saved .../frontend/public/voices/echo.mp3
...
Done.
```

If any voice fails, check that `AZURE_OPENAI_DEPLOYMENT_TTS` is set correctly and that the deployment exists in your Azure subscription.

- [ ] **Step 3: Verify the files were created**

```bash
ls frontend/public/voices/
```

Expected: `alloy.mp3  echo.mp3  fable.mp3  nova.mp3  onyx.mp3  shimmer.mp3`

- [ ] **Step 4: Commit script and generated files**

```bash
git add scripts/generate-voice-previews.mjs frontend/public/voices/
git commit -m "feat: add voice preview MP3s and generation script"
```

---

## Self-Review Checklist

- [x] **Spec coverage**
  - AzureTTSService ✓ Task 2
  - AudioGenerationService Plan A→B chain ✓ Task 3
  - ElevenLabsService removed ✓ Tasks 3 & 4
  - GenerateModule updated ✓ Task 4
  - VoiceStep 6 Azure voices ✓ Task 5
  - MP3 preview generation ✓ Task 6
  - Env var added ✓ Task 1

- [x] **Placeholders:** None — all steps contain complete code

- [x] **Type consistency:**
  - `AzureTTSService.synthesize(text: string, voiceId: string)` — used in Task 2 tests and Task 3 implementation consistently
  - `AudioGenerationService.generateTextToSpeech(text: string, voiceId?: string)` — unchanged public interface, same as original
