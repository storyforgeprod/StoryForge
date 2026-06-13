# Generation Flow Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current `GenerationWizard` + three separate stage components with a full-page 5-step `GenerationFlow` that matches the prototype screens exactly.

**Architecture:** A new `GenerationFlow` orchestrator owns all step state, job IDs, and generation hooks. Each of the 5 steps (`StoryStep`, `ScriptStep`, `StyleStep`, `VoiceStep`, `VideoStep`) is a focused display component. `GeneratePage` is simplified to `AppShell` + `CreateStepsNav` + `GenerationFlow`. Auto-triggers (image gen on style select, audio→video on reaching step 5) live in `GenerationFlow`, keeping step components dumb.

**Tech Stack:** NestJS (backend DTOs, service, queue processor), React 18 + TypeScript (frontend components), Vitest + RTL (frontend tests), Tailwind + shadcn/ui (styling), class-validator (backend validation)

**Design spec:** `docs/superpowers/specs/2026-06-10-generation-flow-redesign-design.md`

---

## File Map

### Backend — modified
| File | Change |
|------|--------|
| `backend/src/generate/dto/generate-script.dto.ts` | Add optional `tone` field |
| `backend/src/generate/generate.service.ts` | Pass `tone` through; update style prompts for 6 new values |
| `backend/src/generate/generate.queue.processor.ts` | Pass `tone` to `generateScriptContent` |
| `backend/src/integrations/azure-openai.service.ts` | Accept `tone`; inject into `buildScriptPrompt` |
| `backend/src/generate/dto/generate-images.dto.ts` | Replace 4-value `StoryStyle` enum with 6 new values |
| `backend/src/generate/elevenlabs.service.ts` | Add internal→ElevenLabs voice ID mapping |

### Frontend — new files
| File | Purpose |
|------|---------|
| `frontend/src/features/generation/utils/parseScript.ts` | Extract `parseScenes` from ScriptReviewStep |
| `frontend/src/features/generation/components/StoryStep.tsx` + test | Step 01 |
| `frontend/src/features/generation/components/ScriptStep.tsx` + test | Step 02 |
| `frontend/src/features/generation/components/ScenePreviewRow.tsx` + test | Inline image preview in StyleStep |
| `frontend/src/features/generation/components/StyleStep.tsx` + test | Step 03 |
| `frontend/src/features/generation/components/VoiceStep.tsx` + test | Step 04 |
| `frontend/src/features/generation/components/VideoStep.tsx` + test | Step 05 |
| `frontend/src/features/generation/components/GenerationFlow.tsx` + test | Orchestrator |

### Frontend — modified
| File | Change |
|------|--------|
| `frontend/src/features/generation/types/index.ts` | Add `WizardStep` type; update `StoryStyle` to 6 values |
| `frontend/src/features/generation/api/generateApi.ts` | Add `tone?` to `postGenerateScript` body |
| `frontend/src/features/generation/hooks/useGenerateScript.ts` | Add `tone?` param to `generate()` |
| `frontend/src/features/generation/components/StyleThumb.tsx` | Add SVGs for `retro-pop` and `3d-toon` |
| `frontend/src/features/generation/components/CreateStepsNav.tsx` | New prop API: `currentStep: WizardStep`; fix step order |
| `frontend/src/features/generation/routes/GeneratePage.tsx` | Simplify to AppShell + GenerationFlow |

### Frontend — deleted
`GenerationWizard.tsx`, `GenerationWizard.test.tsx`, `stages/ImagesStage.tsx`, `stages/AudioStage.tsx`, `stages/VideoStage.tsx`, `stages/ScriptStage.tsx`, `stages/ScriptStage.test.tsx`, `StyleSelector.tsx`, `StyleSelector.test.tsx`, `VoiceSelector.tsx`, `VoiceSelector.test.tsx`, `ScriptReviewStep.tsx`, `DurationSelect.tsx`, `DurationSelect.test.tsx`, `DurationSelector.tsx`, `ScenesSelect.tsx`, `ScenesSelect.test.tsx`, `ScenesSelector.tsx`

### Static assets
`frontend/public/voices/{nova,atlas,lumi,rex,sage}.mp3` — placeholder files (replace with real recordings before demo)

---

## Task 1: Backend — Add `tone` to script generation pipeline

**Files:**
- Modify: `backend/src/generate/dto/generate-script.dto.ts`
- Modify: `backend/src/generate/generate.service.ts`
- Modify: `backend/src/generate/generate.queue.processor.ts`
- Modify: `backend/src/integrations/azure-openai.service.ts`
- Test: `backend/src/generate/generate.service.spec.ts`

- [ ] **Step 1: Write failing test**

In `backend/src/generate/generate.service.spec.ts`, add:
```typescript
it('passes tone to queue job when provided', async () => {
  const dto = { story: 'a'.repeat(100), tone: 'dramatic', targetDuration: 30, targetScenes: 5 };
  jest.spyOn(prisma.job, 'create').mockResolvedValue({ id: 'job-1', createdAt: new Date() } as any);
  const addSpy = jest.spyOn(queue, 'addGenerationJob').mockResolvedValue(undefined as any);
  await service.generateScript('user-1', dto);
  expect(addSpy).toHaveBeenCalledWith(expect.objectContaining({ tone: 'dramatic' }));
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && npx jest generate.service.spec --no-coverage
```
Expected: FAIL — `tone` not forwarded yet.

- [ ] **Step 3: Add `tone` field to `GenerateScriptDto`**

In `backend/src/generate/dto/generate-script.dto.ts`, after the `targetScenes` field:

```typescript
@ApiProperty({
  description: 'Narration tone for script generation',
  example: 'dramatic',
  enum: ['playful', 'dramatic', 'suspenseful', 'energetic'],
  required: false,
})
@IsOptional()
@IsString()
@IsIn(['playful', 'dramatic', 'suspenseful', 'energetic'])
tone?: string;
```

Add `IsIn` to the imports: `import { ..., IsIn } from 'class-validator';`

- [ ] **Step 4: Pass `tone` through `generateScript` in the service**

In `backend/src/generate/generate.service.ts`, inside `generateScript`, update the job metadata and queue call:

```typescript
// In prisma.job.create data.metadata:
metadata: JSON.stringify({
  story: dto.story,
  targetDuration,
  targetScenes,
  tone: dto.tone,           // ADD THIS
}),

// In queue.addGenerationJob:
await this.queue.addGenerationJob({
  jobId: job.id,
  userId,
  projectId: null,
  type: 'script',
  story: dto.story,
  targetDuration,
  targetScenes,
  tone: dto.tone,           // ADD THIS
  _startTime: Date.now(),
});
```

- [ ] **Step 5: Pass `tone` through the queue processor**

In `backend/src/generate/generate.queue.processor.ts`, the job data type already has a `tone?` field if you added it to the interface. Find the call to `generateScriptContent` (~line 63):

```typescript
result = await this.generateService.generateScriptContent(userId, {
  story: story || '',
  targetDuration: job.data.targetDuration,
  targetScenes: job.data.targetScenes,
  tone: job.data.tone,      // ADD THIS
});
```

Also add `tone?: string` to the job data interface at the top of the processor file (the interface that types `job.data`).

- [ ] **Step 6: Update `generateScriptContent` and `azureOpenAI.generateScript`**

In `backend/src/generate/generate.service.ts`, update `generateScriptContent` signature:

```typescript
async generateScriptContent(
  userId: string,
  data: { story: string; targetDuration?: number; targetScenes?: number; tone?: string },
): Promise<{ script: string }> {
  const targetDuration = data.targetDuration ?? 60;
  const targetScenes = data.targetScenes ?? 12;
  const script = await this.azureOpenAIService.generateScript(
    userId,
    data.story,
    targetScenes,
    targetDuration,
    data.tone,               // ADD THIS
  );
  return { script };
}
```

In `backend/src/integrations/azure-openai.service.ts`, update `generateScript` signature and `buildScriptPrompt`:

```typescript
// Update generateScript signature (~line 31):
async generateScript(
  userId: string,
  story: string,
  targetScenes: number = 12,
  targetDuration: number = 60,
  tone?: string,             // ADD THIS
): Promise<string> {
  // ...
  const prompt = this.buildScriptPrompt(story, targetScenes, targetDuration, tone);
  // rest unchanged
```

```typescript
// Update buildScriptPrompt signature and add tone instruction (~line 145):
private buildScriptPrompt(
  story: string,
  targetScenes: number = 12,
  targetDuration: number = 60,
  tone?: string,             // ADD THIS
): string {
  const secondsPerScene = Math.round(targetDuration / targetScenes);
  const toneInstruction = tone
    ? `\nNARRATION TONE: Write with a ${tone} tone throughout all scenes.`
    : '';
  return `You are a professional screenwriter specializing in short-form video content for YouTube Shorts.
${toneInstruction}
Convert the following story into a script suitable for a video lasting approximately ${targetDuration} seconds with exactly ${targetScenes} scenes.
// ... rest of prompt unchanged
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
cd backend && npx jest generate.service.spec --no-coverage
```
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add backend/src/generate/dto/generate-script.dto.ts \
        backend/src/generate/generate.service.ts \
        backend/src/generate/generate.queue.processor.ts \
        backend/src/integrations/azure-openai.service.ts \
        backend/src/generate/generate.service.spec.ts
git commit -m "feat(backend): add tone parameter to script generation pipeline"
```

---

## Task 2: Backend — Update StoryStyle enum to 6 values

**Files:**
- Modify: `backend/src/generate/dto/generate-images.dto.ts`
- Modify: `backend/src/generate/generate.service.ts` (style prompt method)

- [ ] **Step 1: Replace StoryStyle enum in `generate-images.dto.ts`**

Replace the existing `StoryStyle` enum:

```typescript
export enum StoryStyle {
  BOLD_COMIC  = 'bold-comic',
  SOFT_CARTOON = 'soft-cartoon',
  RETRO_POP   = 'retro-pop',
  MANGA_INK   = 'manga-ink',
  STORYBOOK   = 'storybook',
  TOON_3D     = '3d-toon',
}
```

Update the `@ApiProperty` example: `example: StoryStyle.BOLD_COMIC`

- [ ] **Step 2: Update `_buildScenePrompt` in `generate.service.ts`**

Find `_buildScenePrompt` method and replace its style-to-prompt mapping with the 6 new values. Locate the part that uses `data.style` (or `style`) to construct the visual prompt and update:

```typescript
private _buildScenePrompt(scene: { narration: string; onScreen?: string }, style: StoryStyle): string {
  const styleDescriptions: Record<StoryStyle, string> = {
    [StoryStyle.BOLD_COMIC]:   'bold comic book illustration with strong outlines, halftone dots, vibrant yellows and primary colors, POW/ZAP speech bubbles',
    [StoryStyle.SOFT_CARTOON]: 'soft pastel cartoon illustration, rounded forms, gentle lavender and peach palette, friendly and warm',
    [StoryStyle.RETRO_POP]:   'retro pop art illustration, warm cream and beige tones, vintage 60s aesthetic, clean geometric shapes',
    [StoryStyle.MANGA_INK]:   'black and white manga ink illustration, high contrast, speed lines, dramatic screentone shading',
    [StoryStyle.STORYBOOK]:   'dark atmospheric storybook illustration, warm candlelight, deep shadows, painterly texture',
    [StoryStyle.TOON_3D]:     '3D cartoon render, bright sky-blue background, glossy smooth surfaces, Pixar-inspired character design',
  };
  const stylePrompt = styleDescriptions[style] ?? 'illustrated';
  return `${stylePrompt}. Scene: ${scene.narration}. ${scene.onScreen ? `On screen text: "${scene.onScreen}".` : ''} Vertical 9:16 format, no text overlays.`;
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/generate/dto/generate-images.dto.ts \
        backend/src/generate/generate.service.ts
git commit -m "feat(backend): update StoryStyle to 6 new art style values"
```

---

## Task 3: Backend — Add voice ID mapping

**Files:**
- Modify: `backend/src/generate/elevenlabs.service.ts`

- [ ] **Step 1: Add voice map and resolver method to `ElevenLabsService`**

Replace the current stub with:

```typescript
import { Injectable } from '@nestjs/common';

const VOICE_MAP: Record<string, string> = {
  nova:  'EXAVITQu4vr4xnSDxMaL', // replace with real ElevenLabs ID when available
  atlas: 'TX3LPaxmHKxFdv7VOQHJ', // replace with real ElevenLabs ID when available
  lumi:  'pFZP5JQG7iQjIQuC4Bku', // replace with real ElevenLabs ID when available
  rex:   'bIHbv24MWmeRgasZH58o',  // replace with real ElevenLabs ID when available
  sage:  'cgSgspJ2msm6clMCkdW9',  // replace with real ElevenLabs ID when available
};

@Injectable()
export class ElevenLabsService {
  resolveVoiceId(internalId: string): string {
    return VOICE_MAP[internalId] ?? internalId;
  }

  async synthesizeAudio(text: string, voiceId: string = 'nova'): Promise<Buffer> {
    const resolvedId = this.resolveVoiceId(voiceId);
    console.log(`[STUB] Synthesizing audio with voice: ${resolvedId}`);
    return Buffer.from('');
  }

  async getAvailableVoices(): Promise<{ id: string; name: string }[]> {
    return Object.keys(VOICE_MAP).map((id) => ({ id, name: id }));
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/generate/elevenlabs.service.ts
git commit -m "feat(backend): add internal voice ID mapping for 5 new voices"
```

---

## Task 4: Frontend — Update types, API, and hook

**Files:**
- Modify: `frontend/src/features/generation/types/index.ts`
- Modify: `frontend/src/features/generation/api/generateApi.ts`
- Modify: `frontend/src/features/generation/hooks/useGenerateScript.ts`
- Test: `frontend/src/features/generation/api/generateApi.test.ts`

- [ ] **Step 1: Write failing test for `postGenerateScript` tone support**

Create `frontend/src/features/generation/api/generateApi.test.ts` (if it doesn't exist):

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { postGenerateScript } from './generateApi';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ jobId: 'job-1', status: 'pending', createdAt: new Date().toISOString() }),
  });
  localStorage.setItem('storyforge_token', 'test-token');
});

it('sends tone in request body', async () => {
  await postGenerateScript({ story: 'test story', tone: 'dramatic' });
  const body = JSON.parse(mockFetch.mock.calls[0][1].body);
  expect(body.tone).toBe('dramatic');
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npm test -- generateApi
```
Expected: FAIL — `tone` not in body type yet.

- [ ] **Step 3: Update `StoryStyle` type and add `WizardStep` in `types/index.ts`**

Replace the `StoryStyle` const/type near the top of `frontend/src/features/generation/types/index.ts`:

```typescript
export const StoryStyle = {
  BOLD_COMIC:   'bold-comic',
  SOFT_CARTOON: 'soft-cartoon',
  RETRO_POP:    'retro-pop',
  MANGA_INK:    'manga-ink',
  STORYBOOK:    'storybook',
  TOON_3D:      '3d-toon',
} as const;
export type StoryStyle = typeof StoryStyle[keyof typeof StoryStyle];

export type WizardStep = 'story' | 'script' | 'style' | 'voice' | 'video';
```

- [ ] **Step 4: Add `tone?` to `postGenerateScript` in `generateApi.ts`**

Update the function signature:

```typescript
export async function postGenerateScript(
  body: { story: string; tone?: string; targetDuration?: number; targetScenes?: number },
): Promise<{ jobId: string; status: string; createdAt: string }> {
```

(No other change needed — `JSON.stringify(body)` already forwards all fields.)

- [ ] **Step 5: Add `tone?` to `useGenerateScript.generate`**

In `frontend/src/features/generation/hooks/useGenerateScript.ts`, update the `generate` signature:

```typescript
// In UseGenerateScriptReturn type:
generate: (story: string, targetDuration?: number, targetScenes?: number, tone?: string) => void;

// In the generate callback:
const generate = useCallback(
  async (story: string, targetDuration?: number, targetScenes?: number, tone?: string) => {
    setState({ phase: 'submitting' });
    try {
      const { jobId } = await postGenerateScript({ story, targetDuration, targetScenes, tone });
      // rest unchanged
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd frontend && npm test -- generateApi
```
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add frontend/src/features/generation/types/index.ts \
        frontend/src/features/generation/api/generateApi.ts \
        frontend/src/features/generation/api/generateApi.test.ts \
        frontend/src/features/generation/hooks/useGenerateScript.ts
git commit -m "feat(frontend): add tone param and update StoryStyle to 6 values"
```

---

## Task 5: Frontend — Update StyleThumb for 6 styles

**Files:**
- Modify: `frontend/src/features/generation/components/StyleThumb.tsx`

- [ ] **Step 1: Update `ArtStyle` type and `STYLE_TO_ART` mapping**

Replace the `ArtStyle` type and `STYLE_TO_ART` map at the top of `StyleThumb.tsx`:

```typescript
type ArtStyle = 'bold-comic' | 'soft-cartoon' | 'retro-pop' | 'manga-ink' | 'storybook' | '3d-toon';

const STYLE_TO_ART: Record<StoryStyle, ArtStyle> = {
  'bold-comic':   'bold-comic',
  'soft-cartoon': 'soft-cartoon',
  'retro-pop':    'retro-pop',
  'manga-ink':    'manga-ink',
  'storybook':    'storybook',
  '3d-toon':      '3d-toon',
};
```

Also update the `ACCENTS` map to include the two new styles:

```typescript
const ACCENTS: Record<ArtStyle, [string, string, string]> = {
  'bold-comic':   ['#FF3B30', '#007AFF', '#34C759'],
  'soft-cartoon': ['#5533AA', '#AA3355', '#3377AA'],
  'retro-pop':    ['#E8A040', '#C05020', '#F0D080'],
  'manga-ink':    ['#111', '#111', '#111'],
  'storybook':    ['#FFD080', '#FFD080', '#FFD080'],
  '3d-toon':      ['#00B4D8', '#0077B6', '#48CAE4'],
};
```

- [ ] **Step 2: Update the `if (art === 'bold comic')` and `if (art === 'manga ink')` checks to use hyphenated values**

Change all four `if (art === ...)` conditions to use the new hyphenated values:
- `'bold comic'` → `'bold-comic'`
- `'soft cartoon'` → `'soft-cartoon'`
- `'manga ink'` → `'manga-ink'`
- `// storybook` → still handled by the final `return`

- [ ] **Step 3: Add SVG branches for `retro-pop` and `3d-toon`**

Add these two branches before the final `// storybook` return:

```typescript
if (art === 'retro-pop') {
  return (
    <svg viewBox="0 0 90 160" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="90" height="160" fill="#F5E6C8" />
      {/* grid lines */}
      {Array.from({ length: 9 }, (_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 20} x2="90" y2={i * 20} stroke="#C8A060" strokeWidth=".4" opacity=".4" />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <line key={`v${i}`} x1={i * 22} y1="0" x2={i * 22} y2="160" stroke="#C8A060" strokeWidth=".4" opacity=".4" />
      ))}
      {/* retro sun */}
      <circle cx="45" cy="55" r="28" fill={ACCENTS['retro-pop'][v]} />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * 45 * Math.PI) / 180;
        return (
          <line key={i}
            x1={45 + Math.cos(a) * 30} y1={55 + Math.sin(a) * 30}
            x2={45 + Math.cos(a) * 40} y2={55 + Math.sin(a) * 40}
            stroke={ACCENTS['retro-pop'][v]} strokeWidth="3" strokeLinecap="round"
          />
        );
      })}
      <circle cx="45" cy="55" r="20" fill="#F5E6C8" />
      {/* face */}
      <circle cx="38" cy="51" r="4" fill="#111" />
      <circle cx="52" cy="51" r="4" fill="#111" />
      <circle cx="39" cy="49" r="1.5" fill="#fff" />
      <circle cx="53" cy="49" r="1.5" fill="#fff" />
      <path d={v === 1 ? 'M37 59 Q45 54 53 59' : 'M37 61 Q45 67 53 61'} fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
      {/* ground */}
      <rect x="0" y="115" width="90" height="45" fill="#C8A060" opacity=".5" />
      {captionBar('rgba(60,30,0,0.75)', '#F5E6C8')}
    </svg>
  );
}

if (art === '3d-toon') {
  return (
    <svg viewBox="0 0 90 160" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="90" height="160" fill="#87CEEB" />
      {/* clouds */}
      <ellipse cx="20" cy="25" rx="16" ry="9" fill="#fff" opacity=".85" />
      <ellipse cx="32" cy="20" rx="12" ry="8" fill="#fff" opacity=".85" />
      <ellipse cx="72" cy="35" rx="13" ry="7" fill="#fff" opacity=".75" />
      {/* ground */}
      <ellipse cx="45" cy="145" rx="40" ry="14" fill="#5AB552" />
      <rect x="5" y="138" width="80" height="22" fill="#4A9942" />
      {/* 3d character body */}
      <ellipse cx="45" cy="105" rx="18" ry="22" fill={ACCENTS['3d-toon'][v]} />
      {/* head */}
      <circle cx="45" cy="72" r="22" fill="#FFDBB5" />
      {/* eyes */}
      <circle cx="37" cy="68" r="7" fill="#fff" />
      <circle cx="53" cy="68" r="7" fill="#fff" />
      <circle cx="38" cy="69" r="4.5" fill={ACCENTS['3d-toon'][v]} />
      <circle cx="54" cy="69" r="4.5" fill={ACCENTS['3d-toon'][v]} />
      <circle cx="39" cy="67" r="2" fill="#fff" />
      <circle cx="55" cy="67" r="2" fill="#fff" />
      {/* mouth */}
      <path d={v === 1 ? 'M37 80 Q45 74 53 80' : 'M37 82 Q45 89 53 82'} fill="none" stroke="#C07040" strokeWidth="2.5" strokeLinecap="round" />
      {/* shine on head */}
      <ellipse cx="35" cy="58" rx="6" ry="4" fill="#fff" opacity=".35" transform="rotate(-20 35 58)" />
      {captionBar('rgba(0,50,100,0.72)', '#fff')}
    </svg>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/generation/components/StyleThumb.tsx
git commit -m "feat(frontend): add retro-pop and 3d-toon art style SVGs to StyleThumb"
```

---

## Task 6: Frontend — Refactor CreateStepsNav

**Files:**
- Modify: `frontend/src/features/generation/components/CreateStepsNav.tsx`

- [ ] **Step 1: Write failing test**

Create `frontend/src/features/generation/components/CreateStepsNav.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CreateStepsNav } from './CreateStepsNav';

it('marks current step as active', () => {
  render(<CreateStepsNav currentStep="script" />);
  const scriptItem = screen.getByText('Script').closest('[aria-current="step"]');
  expect(scriptItem).toBeInTheDocument();
});

it('renders steps in order: Story, Script, Style, Voice, Video', () => {
  render(<CreateStepsNav currentStep="story" />);
  const items = screen.getAllByRole('listitem');
  expect(items[0]).toHaveTextContent('Story');
  expect(items[1]).toHaveTextContent('Script');
  expect(items[2]).toHaveTextContent('Style');
  expect(items[3]).toHaveTextContent('Voice');
  expect(items[4]).toHaveTextContent('Video');
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npm test -- CreateStepsNav
```
Expected: FAIL

- [ ] **Step 3: Rewrite `CreateStepsNav`**

Replace the entire file content:

```typescript
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WizardStep } from '../types';

export type CreateStepsNavProps = {
  currentStep: WizardStep;
};

const STEPS: { id: WizardStep; num: string; label: string }[] = [
  { id: 'story',  num: '01', label: 'Story' },
  { id: 'script', num: '02', label: 'Script' },
  { id: 'style',  num: '03', label: 'Style' },
  { id: 'voice',  num: '04', label: 'Voice' },
  { id: 'video',  num: '05', label: 'Video' },
];

const STEP_ORDER: WizardStep[] = ['story', 'script', 'style', 'voice', 'video'];

export const CreateStepsNav = ({ currentStep }: CreateStepsNavProps) => {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <ol className="ml-3.5 mt-1 flex flex-col gap-px border-l-2 border-bd2 py-1 pl-3.5">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isActive = step.id === currentStep;
        return (
          <li
            key={step.id}
            aria-current={isActive ? 'step' : undefined}
            className={cn(
              'flex items-center gap-2.5 rounded-sm px-2.5 py-[7px] font-mono text-[11px] font-medium uppercase tracking-[0.04em]',
              isActive && 'text-primary',
              isDone && 'text-muted-foreground',
              !isActive && !isDone && 'text-mut2',
            )}
          >
            <span className="w-5">
              {isDone ? <Check className="h-3 w-3" /> : step.num}
            </span>
            {step.label}
          </li>
        );
      })}
    </ol>
  );
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test -- CreateStepsNav
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/generation/components/CreateStepsNav.tsx \
        frontend/src/features/generation/components/CreateStepsNav.test.tsx
git commit -m "refactor(frontend): simplify CreateStepsNav to currentStep prop; fix step order"
```

---

## Task 7: Frontend — StoryStep component

**Files:**
- Create: `frontend/src/features/generation/components/StoryStep.tsx`
- Create: `frontend/src/features/generation/components/StoryStep.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// StoryStep.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StoryStep } from './StoryStep';

const base = {
  story: '',
  onStoryChange: vi.fn(),
  tone: 'playful',
  onToneChange: vi.fn(),
  targetDuration: 30,
  onDurationChange: vi.fn(),
  onGenerate: vi.fn(),
  isGenerating: false,
};

it('renders textarea and Generate button', () => {
  render(<StoryStep {...base} />);
  expect(screen.getByRole('textbox')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /generate script/i })).toBeInTheDocument();
});

it('calls onGenerate when story is valid', () => {
  const onGenerate = vi.fn();
  render(<StoryStep {...base} story={'a'.repeat(60)} onGenerate={onGenerate} />);
  fireEvent.click(screen.getByRole('button', { name: /generate script/i }));
  expect(onGenerate).toHaveBeenCalledOnce();
});

it('does not call onGenerate when story is too short', () => {
  const onGenerate = vi.fn();
  render(<StoryStep {...base} story="short" onGenerate={onGenerate} />);
  fireEvent.click(screen.getByRole('button', { name: /generate script/i }));
  expect(onGenerate).not.toHaveBeenCalled();
});

it('fills textarea when example prompt is clicked', () => {
  const onStoryChange = vi.fn();
  render(<StoryStep {...base} onStoryChange={onStoryChange} />);
  const exampleButtons = screen.getAllByRole('button', { name: /cat|deep-sea|office/i });
  fireEvent.click(exampleButtons[0]);
  expect(onStoryChange).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npm test -- StoryStep
```
Expected: FAIL — module not found.

- [ ] **Step 3: Create `StoryStep.tsx`**

```typescript
import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StoryInput } from './StoryInput';
import { validateStory } from '../utils/validation';

const TONES = [
  { value: 'playful',     label: 'Playful' },
  { value: 'dramatic',    label: 'Dramatic' },
  { value: 'suspenseful', label: 'Suspenseful' },
  { value: 'energetic',   label: 'Energetic' },
];

const LENGTHS = [
  { value: 30, label: '30s' },
  { value: 60, label: '60s' },
  { value: 90, label: '90s' },
];

const EXAMPLES = [
  'A cat who secretly runs a black market for belly rub tokens...',
  '3 deep-sea creatures discover they\'re actually roommates...',
  'The day the office plant gained sentience and filed HR complaints...',
];

export type StoryStepProps = {
  story: string;
  onStoryChange: (v: string) => void;
  tone: string;
  onToneChange: (v: string) => void;
  targetDuration: number;
  onDurationChange: (v: number) => void;
  onGenerate: () => void;
  isGenerating: boolean;
};

export const StoryStep = ({
  story,
  onStoryChange,
  tone,
  onToneChange,
  targetDuration,
  onDurationChange,
  onGenerate,
  isGenerating,
}: StoryStepProps) => {
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const { valid } = validateStory(story);

  const handleGenerate = () => {
    setSubmitAttempted(true);
    if (!valid) return;
    onGenerate();
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-2 font-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-acc">
          <Sparkles className="h-3.5 w-3.5" />
          AI script studio
        </div>
        <h1 className="font-head text-[34px] font-extrabold leading-[1.05] tracking-[-0.04em]">
          Turn any story into a viral short
        </h1>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
          YOUR STORY
        </p>
        <StoryInput
          value={story}
          onChange={onStoryChange}
          showErrors={submitAttempted}
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <Select value={tone} onValueChange={onToneChange}>
              <SelectTrigger className="h-8 w-auto gap-1 rounded-full border-border bg-elev px-3 text-[13px]">
                <span className="text-muted-foreground">Tone:&nbsp;</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(targetDuration)}
              onValueChange={(v) => onDurationChange(Number(v))}
            >
              <SelectTrigger className="h-8 w-auto gap-1 rounded-full border-border bg-elev px-3 text-[13px]">
                <span className="text-muted-foreground">Length:&nbsp;</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LENGTHS.map((l) => (
                  <SelectItem key={l.value} value={String(l.value)}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGenerate} disabled={isGenerating || !valid}>
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Generate script
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-[13px] text-muted-foreground">Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            aria-label={ex}
            onClick={() => onStoryChange(ex)}
            className="rounded-full border border-border bg-elev px-4 py-1.5 text-[13px] text-foreground transition hover:bg-elev2"
          >
            {ex.slice(0, 32)}…
          </button>
        ))}
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test -- StoryStep
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/generation/components/StoryStep.tsx \
        frontend/src/features/generation/components/StoryStep.test.tsx
git commit -m "feat(frontend): add StoryStep component (tone + length selects + examples)"
```

---

## Task 8: Frontend — ScriptStep component

**Files:**
- Create: `frontend/src/features/generation/utils/parseScript.ts`
- Create: `frontend/src/features/generation/components/ScriptStep.tsx`
- Create: `frontend/src/features/generation/components/ScriptStep.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// ScriptStep.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ScriptStep } from './ScriptStep';
import type { GenerateScriptState } from '../types';

const completedState: GenerateScriptState = {
  phase: 'completed',
  script: `Scene 1: The cat stares. (3s)\n[Sound: Meow]\n\nScene 2: Plot twist. (3s)\n[Sound: Gasp]`,
};

it('renders scene cards when completed', () => {
  render(<ScriptStep state={completedState} onRegenerate={vi.fn()} onContinue={vi.fn()} />);
  expect(screen.getByText(/the cat stares/i)).toBeInTheDocument();
  expect(screen.getByText(/plot twist/i)).toBeInTheDocument();
});

it('enables Continue button only when completed', () => {
  const loadingState: GenerateScriptState = { phase: 'polling', jobId: 'j1', attempts: 0 };
  render(<ScriptStep state={loadingState} onRegenerate={vi.fn()} onContinue={vi.fn()} />);
  expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
});

it('calls onContinue when Continue is clicked', () => {
  const onContinue = vi.fn();
  render(<ScriptStep state={completedState} onRegenerate={vi.fn()} onContinue={onContinue} />);
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  expect(onContinue).toHaveBeenCalledOnce();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npm test -- ScriptStep
```
Expected: FAIL

- [ ] **Step 3: Extract `parseScenes` to `utils/parseScript.ts`**

Copy the `parseScenes` function from `ScriptReviewStep.tsx` into a new file:

```typescript
// frontend/src/features/generation/utils/parseScript.ts
export type ParsedScene = {
  index: number;
  narration: string;
  onScreen: string;
  duration: number;
};

export function parseScenes(script: string): ParsedScene[] {
  const scenes: ParsedScene[] = [];
  const blocks = script.split(/(?=^Scene\s+\d+:)/mi);

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    const headerMatch = trimmed.match(/^Scene\s+(\d+):\s*(.+?)(?:\s*\((\d+)s\))?$/im);
    if (!headerMatch) continue;
    const index = parseInt(headerMatch[1], 10);
    const narration = headerMatch[2].trim().replace(/^\[|\]$/g, '').trim();
    const duration = headerMatch[3] ? parseInt(headerMatch[3], 10) : 0;
    const soundMatch = trimmed.match(/\[Sound:\s*(.+?)\]/i);
    const onScreen = soundMatch ? soundMatch[1].trim() : '';
    scenes.push({ index, narration, onScreen, duration });
  }

  if (scenes.length === 0) {
    const paragraphs = script.split(/\n{2,}/).filter((p) => p.trim());
    return paragraphs.slice(0, 12).map((p, i) => ({
      index: i + 1,
      narration: p.trim().split('\n')[0].slice(0, 200),
      onScreen: '',
      duration: 0,
    }));
  }

  return scenes;
}
```

- [ ] **Step 4: Create `ScriptStep.tsx`**

```typescript
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseScenes } from '../utils/parseScript';
import type { GenerateScriptState } from '../types';

export type ScriptStepProps = {
  state: GenerateScriptState;
  onRegenerate: () => void;
  onContinue: () => void;
};

export const ScriptStep = ({ state, onRegenerate, onContinue }: ScriptStepProps) => {
  const isLoading = state.phase === 'submitting' || state.phase === 'polling';
  const isCompleted = state.phase === 'completed';

  const scenes = isCompleted ? parseScenes(state.script) : [];
  const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-head text-[32px] font-extrabold tracking-[-0.04em]">Your script</h1>
          {isCompleted && (
            <p className="mt-1 text-[14px] text-muted-foreground">
              {scenes.length} scenes{totalDuration > 0 ? ` · ~${totalDuration}s` : ''}
            </p>
          )}
        </div>
        {isCompleted && (
          <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={onRegenerate}>
            <RefreshCw className="h-3.5 w-3.5" />
            Regenerate all
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex flex-col items-center gap-4 py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Generating your script…</p>
        </div>
      )}

      {state.phase === 'error' && (
        <div className="flex flex-col items-center gap-4 py-16">
          <p className="text-sm text-destructive">{state.message}</p>
          <Button variant="outline" onClick={onRegenerate}>Retry</Button>
        </div>
      )}

      {isCompleted && (
        <div className="space-y-2">
          {scenes.map((scene) => (
            <div
              key={scene.index}
              className="flex gap-3.5 rounded-xl bg-elev p-3.5"
            >
              <div className="relative flex h-[76px] w-[64px] shrink-0 items-end rounded-lg bg-elev2 p-1.5">
                <span className="rounded px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none bg-acc text-on-acc">
                  {String(scene.index).padStart(2, '0')}
                </span>
              </div>
              <div className="min-w-0 flex-1 space-y-1 py-1">
                <p className="line-clamp-3 text-sm font-medium leading-snug text-foreground">
                  {scene.narration}
                </p>
                {scene.onScreen && (
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    on-screen: &ldquo;{scene.onScreen}&rdquo;
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button disabled={!isCompleted} onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
};
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd frontend && npm test -- ScriptStep
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features/generation/utils/parseScript.ts \
        frontend/src/features/generation/components/ScriptStep.tsx \
        frontend/src/features/generation/components/ScriptStep.test.tsx
git commit -m "feat(frontend): add ScriptStep and extract parseScenes utility"
```

---

## Task 9: Frontend — ScenePreviewRow component

**Files:**
- Create: `frontend/src/features/generation/components/ScenePreviewRow.tsx`
- Create: `frontend/src/features/generation/components/ScenePreviewRow.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// ScenePreviewRow.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ScenePreviewRow } from './ScenePreviewRow';

it('renders N skeletons when imageUrls is empty', () => {
  render(<ScenePreviewRow sceneCount={5} imageUrls={[]} />);
  expect(screen.getAllByTestId('scene-skeleton')).toHaveLength(5);
});

it('renders images when imageUrls are provided', () => {
  const urls = ['http://a.com/1.png', 'http://a.com/2.png'];
  render(<ScenePreviewRow sceneCount={2} imageUrls={urls} />);
  const imgs = screen.getAllByRole('img');
  expect(imgs).toHaveLength(2);
  expect(imgs[0]).toHaveAttribute('src', urls[0]);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npm test -- ScenePreviewRow
```
Expected: FAIL

- [ ] **Step 3: Create `ScenePreviewRow.tsx`**

```typescript
import { cn } from '@/lib/utils';

export type ScenePreviewRowProps = {
  sceneCount: number;
  imageUrls: string[];
  className?: string;
};

export const ScenePreviewRow = ({ sceneCount, imageUrls, className }: ScenePreviewRowProps) => (
  <div className={cn('flex gap-3 overflow-x-auto pb-2', className)}>
    {Array.from({ length: sceneCount }, (_, i) => {
      const url = imageUrls[i];
      return (
        <div
          key={i}
          className="relative w-[90px] shrink-0 overflow-hidden rounded-xl border border-border bg-elev"
          style={{ aspectRatio: '9 / 16' }}
        >
          {url ? (
            <img src={url} alt={`Scene ${i + 1}`} className="h-full w-full object-cover" />
          ) : (
            <div
              data-testid="scene-skeleton"
              className="h-full w-full animate-pulse bg-elev2"
            />
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
            <span className="font-mono text-[9px] font-bold text-white/80">
              Scene {String(i + 1).padStart(2, '0')}
            </span>
          </div>
        </div>
      );
    })}
  </div>
);
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test -- ScenePreviewRow
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/generation/components/ScenePreviewRow.tsx \
        frontend/src/features/generation/components/ScenePreviewRow.test.tsx
git commit -m "feat(frontend): add ScenePreviewRow with skeleton loading"
```

---

## Task 10: Frontend — StyleStep component

**Files:**
- Create: `frontend/src/features/generation/components/StyleStep.tsx`
- Create: `frontend/src/features/generation/components/StyleStep.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// StyleStep.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StyleStep } from './StyleStep';
import type { GenerateImagesState } from '../types';

const idleImages: GenerateImagesState = { phase: 'idle' };

it('renders 6 style options', () => {
  render(<StyleStep value={null} onChange={vi.fn()} imagesState={idleImages} sceneCount={5} onContinue={vi.fn()} />);
  expect(screen.getByLabelText('Bold Comic')).toBeInTheDocument();
  expect(screen.getByLabelText('3D Toon')).toBeInTheDocument();
});

it('calls onChange when a style is selected', () => {
  const onChange = vi.fn();
  render(<StyleStep value={null} onChange={onChange} imagesState={idleImages} sceneCount={5} onContinue={vi.fn()} />);
  fireEvent.click(screen.getByLabelText('Manga Ink'));
  expect(onChange).toHaveBeenCalledWith('manga-ink');
});

it('enables Continue button when a style is selected', () => {
  render(<StyleStep value="bold-comic" onChange={vi.fn()} imagesState={idleImages} sceneCount={5} onContinue={vi.fn()} />);
  expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled();
});

it('shows ScenePreviewRow when a style is selected', () => {
  render(<StyleStep value="bold-comic" onChange={vi.fn()} imagesState={idleImages} sceneCount={3} onContinue={vi.fn()} />);
  expect(screen.getAllByTestId('scene-skeleton')).toHaveLength(3);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npm test -- StyleStep
```
Expected: FAIL

- [ ] **Step 3: Create `StyleStep.tsx`**

```typescript
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { StyleThumb } from './StyleThumb';
import { ScenePreviewRow } from './ScenePreviewRow';
import type { StoryStyle, GenerateImagesState } from '../types';

type StyleOption = { value: StoryStyle; label: string; description: string };

const STYLE_OPTIONS: StyleOption[] = [
  { value: 'bold-comic',   label: 'Bold Comic',   description: 'bold comic · illustrated' },
  { value: 'soft-cartoon', label: 'Soft Cartoon',  description: 'soft cartoon · illustrated' },
  { value: 'retro-pop',    label: 'Retro Pop',     description: 'retro pop · illustrated' },
  { value: 'manga-ink',    label: 'Manga Ink',     description: 'manga ink · illustrated' },
  { value: 'storybook',    label: 'Storybook',     description: 'storybook · illustrated' },
  { value: '3d-toon',      label: '3D Toon',       description: '3d toon · illustrated' },
];

export type StyleStepProps = {
  value: StoryStyle | null;
  onChange: (style: StoryStyle) => void;
  imagesState: GenerateImagesState;
  sceneCount: number;
  onContinue: () => void;
};

export const StyleStep = ({ value, onChange, imagesState, sceneCount, onContinue }: StyleStepProps) => {
  const imageUrls = imagesState.phase === 'completed' ? imagesState.imageUrls : [];
  const hasError = imagesState.phase === 'error';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-head text-[32px] font-extrabold tracking-[-0.04em]">Pick your art style</h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">Every scene will be illustrated in this look.</p>
      </div>

      <RadioGroup
        value={value ?? undefined}
        onValueChange={(v) => onChange(v as StoryStyle)}
        aria-label="Select art style"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        {STYLE_OPTIONS.map((option) => {
          const id = `style-${option.value}`;
          const checked = value === option.value;
          return (
            <div key={option.value} className="relative">
              <RadioGroupItem id={id} value={option.value} aria-label={option.label} className="peer sr-only" />
              <Label
                htmlFor={id}
                className={cn(
                  'block cursor-pointer overflow-hidden rounded-xl border bg-card transition-all',
                  'hover:-translate-y-0.5 hover:border-bd2',
                  checked ? 'border-primary shadow-[0_0_0_1px_var(--primary)]' : 'border-border',
                )}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <StyleThumb style={option.value} className="h-full w-full object-cover" />
                  <span className={cn(
                    'absolute right-2 top-2 grid h-[22px] w-[22px] place-items-center rounded-full bg-primary text-on-acc transition-all',
                    checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
                  )}>
                    <Check className="h-3 w-3" />
                  </span>
                </div>
                <div className="px-3 py-2.5">
                  <div className="text-[13.5px] font-bold text-foreground">{option.label}</div>
                  <div className="mt-0.5 text-[11.5px] text-mut2">{option.description}</div>
                </div>
              </Label>
            </div>
          );
        })}
      </RadioGroup>

      {value && (
        <div>
          <p className="mb-3 text-[14px] font-semibold text-foreground">
            Your scenes in <span className="text-primary">{STYLE_OPTIONS.find((o) => o.value === value)?.label}</span>
          </p>
          <p className="mb-3 text-[12px] text-muted-foreground">
            {sceneCount} scenes illustrated in this style — scroll to preview all
          </p>
          <ScenePreviewRow sceneCount={sceneCount} imageUrls={imageUrls} />
          {hasError && (
            <p className="mt-2 text-xs text-destructive">
              Image generation failed. You can still continue — images will be skipped.
            </p>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <Button disabled={!value} onClick={onContinue}>Continue</Button>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test -- StyleStep
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/generation/components/StyleStep.tsx \
        frontend/src/features/generation/components/StyleStep.test.tsx
git commit -m "feat(frontend): add StyleStep with 6 art styles and inline ScenePreviewRow"
```

---

## Task 11: Static voice preview files

**Files:**
- Create: `frontend/public/voices/nova.mp3`, `atlas.mp3`, `lumi.mp3`, `rex.mp3`, `sage.mp3`

- [ ] **Step 1: Create placeholder files**

```bash
mkdir -p frontend/public/voices
for voice in nova atlas lumi rex sage; do
  touch "frontend/public/voices/${voice}.mp3"
done
```

On Windows PowerShell:
```powershell
New-Item -ItemType Directory -Force "frontend/public/voices"
foreach ($v in @('nova','atlas','lumi','rex','sage')) {
  New-Item -ItemType File -Path "frontend/public/voices/$v.mp3" -Force | Out-Null
}
```

> **Note:** These are empty placeholder files. Replace each one with a real ~5s ElevenLabs audio sample before demo. Use the voice IDs defined in `backend/src/generate/elevenlabs.service.ts` and the ElevenLabs TTS API or website to generate a sample sentence per voice.

- [ ] **Step 2: Commit**

```bash
git add frontend/public/voices/
git commit -m "chore: add placeholder voice preview files (replace with real audio before demo)"
```

---

## Task 12: Frontend — VoiceStep component

**Files:**
- Create: `frontend/src/features/generation/components/VoiceStep.tsx`
- Create: `frontend/src/features/generation/components/VoiceStep.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// VoiceStep.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VoiceStep } from './VoiceStep';

it('renders 5 voice options', () => {
  render(<VoiceStep value={null} onChange={vi.fn()} onContinue={vi.fn()} />);
  expect(screen.getByText('Nova')).toBeInTheDocument();
  expect(screen.getByText('Atlas')).toBeInTheDocument();
  expect(screen.getByText('Lumi')).toBeInTheDocument();
  expect(screen.getByText('Rex')).toBeInTheDocument();
  expect(screen.getByText('Sage')).toBeInTheDocument();
});

it('enables Continue button after selection', () => {
  render(<VoiceStep value="atlas" onChange={vi.fn()} onContinue={vi.fn()} />);
  expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled();
});

it('disables Continue button when no voice is selected', () => {
  render(<VoiceStep value={null} onChange={vi.fn()} onContinue={vi.fn()} />);
  expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
});

it('calls onChange when a voice is selected', () => {
  const onChange = vi.fn();
  render(<VoiceStep value={null} onChange={onChange} onContinue={vi.fn()} />);
  fireEvent.click(screen.getByLabelText('Nova'));
  expect(onChange).toHaveBeenCalledWith('nova');
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npm test -- VoiceStep
```
Expected: FAIL

- [ ] **Step 3: Create `VoiceStep.tsx`**

```typescript
import { useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type VoiceMeta = {
  id: string;
  name: string;
  tag: string;
  description: string;
};

const VOICES: VoiceMeta[] = [
  { id: 'nova',  name: 'Nova',  tag: 'Energetic', description: 'Bright, fast — perfect for hooks' },
  { id: 'atlas', name: 'Atlas', tag: 'Deep',       description: 'Calm, cinematic narrator' },
  { id: 'lumi',  name: 'Lumi',  tag: 'Friendly',   description: 'Warm, conversational, gen-z' },
  { id: 'rex',   name: 'Rex',   tag: 'Hype',        description: 'Loud, punchy sports-caster' },
  { id: 'sage',  name: 'Sage',  tag: 'Soft',        description: 'Gentle ASMR-style whisper' },
];

const EQ_DELAYS = ['[animation-delay:0s]','[animation-delay:.1s]','[animation-delay:.25s]','[animation-delay:.15s]','[animation-delay:.32s]','[animation-delay:.05s]','[animation-delay:.22s]'];

export type VoiceStepProps = {
  value: string | null;
  onChange: (voiceId: string) => void;
  onContinue: () => void;
};

export const VoiceStep = ({ value, onChange, onContinue }: VoiceStepProps) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  const handlePlay = (id: string) => {
    const audio = audioRefs.current[id];
    if (!audio) return;
    if (playingId === id) {
      audio.pause();
      audio.currentTime = 0;
      setPlayingId(null);
    } else {
      Object.values(audioRefs.current).forEach((a) => { if (a) { a.pause(); a.currentTime = 0; } });
      setPlayingId(id);
      audio.play().catch(() => setPlayingId(null));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-head text-[32px] font-extrabold tracking-[-0.04em]">Choose a voice</h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">Press play to preview, then select your narrator.</p>
      </div>

      <RadioGroup
        value={value ?? undefined}
        onValueChange={onChange}
        aria-label="Select voice"
        className="flex flex-col gap-2.5"
      >
        {VOICES.map((voice) => {
          const radioId = `voice-${voice.id}`;
          const isChecked = value === voice.id;
          const isPlaying = playingId === voice.id;
          return (
            <div
              key={voice.id}
              className={cn(
                'flex items-center gap-3.5 rounded-xl border p-4 transition-all',
                isChecked
                  ? 'border-primary bg-acc-soft shadow-[0_0_0_1px_var(--primary)]'
                  : 'border-border bg-card hover:border-bd2',
              )}
            >
              <button
                type="button"
                onClick={() => handlePlay(voice.id)}
                aria-label={`${isPlaying ? 'Pause' : 'Play'} ${voice.name}`}
                className={cn(
                  'grid h-11 w-11 flex-none place-items-center rounded-full border transition',
                  isPlaying
                    ? 'border-transparent bg-primary text-on-acc'
                    : 'border-border bg-elev text-foreground hover:border-transparent hover:bg-primary hover:text-on-acc',
                )}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>

              <Label htmlFor={radioId} className="min-w-0 flex-1 cursor-pointer">
                <span className="flex items-center gap-2 text-[14.5px] font-bold text-foreground">
                  {voice.name}
                  <span className="rounded-full bg-elev2 px-[7px] py-0.5 text-[10.5px] font-semibold text-muted-foreground">
                    {voice.tag}
                  </span>
                </span>
                <span className="mt-0.5 block text-[12.5px] text-mut2">{voice.description}</span>
              </Label>

              <div
                className={cn('flex h-[26px] w-[78px] items-end gap-[3px] transition-opacity', isPlaying ? 'opacity-100' : 'opacity-25')}
                aria-hidden="true"
              >
                {EQ_DELAYS.map((delay, i) => (
                  <span key={i} className={cn('h-[30%] flex-1 rounded-[2px] bg-primary', isPlaying && `animate-eq ${delay}`)} />
                ))}
              </div>

              <RadioGroupItem id={radioId} value={voice.id} aria-label={voice.name} className="h-[22px] w-[22px] flex-none" />
              <audio
                ref={(el) => { audioRefs.current[voice.id] = el; }}
                src={`/voices/${voice.id}.mp3`}
                onEnded={() => setPlayingId(null)}
              />
            </div>
          );
        })}
      </RadioGroup>

      <div className="flex justify-end">
        <Button disabled={!value} onClick={onContinue}>Continue</Button>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test -- VoiceStep
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/generation/components/VoiceStep.tsx \
        frontend/src/features/generation/components/VoiceStep.test.tsx
git commit -m "feat(frontend): add VoiceStep with 5 voices and static audio preview"
```

---

## Task 13: Frontend — VideoStep component

**Files:**
- Create: `frontend/src/features/generation/components/VideoStep.tsx`
- Create: `frontend/src/features/generation/components/VideoStep.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// VideoStep.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VideoStep } from './VideoStep';
import type { GenerateAudioState, GenerateVideoState } from '../types';

const idle = (s: string) => ({ phase: s }) as any;

it('shows "Generating audio" when audio is loading', () => {
  render(
    <VideoStep
      artStyleLabel="Bold Comic" voiceName="Atlas" sceneCount={5} targetDuration={30}
      firstImageUrl={undefined}
      audioState={{ phase: 'polling', jobId: 'a1' }}
      videoState={{ phase: 'idle' }}
      onRetryAudio={vi.fn()} onRetryVideo={vi.fn()} onReset={vi.fn()}
    />
  );
  expect(screen.getByText(/generating audio/i)).toBeInTheDocument();
});

it('shows download button when video is completed', () => {
  render(
    <VideoStep
      artStyleLabel="Bold Comic" voiceName="Atlas" sceneCount={5} targetDuration={30}
      firstImageUrl={undefined}
      audioState={{ phase: 'completed', audioUrl: '/audio.mp3', audioLength: 30 }}
      videoState={{ phase: 'completed', videoUrl: '/video.mp4', duration: 30, fileSize: 1000 }}
      onRetryAudio={vi.fn()} onRetryVideo={vi.fn()} onReset={vi.fn()}
    />
  );
  expect(screen.getByRole('link', { name: /download/i })).toBeInTheDocument();
});

it('shows retry audio button on audio error', () => {
  const onRetryAudio = vi.fn();
  render(
    <VideoStep
      artStyleLabel="Bold Comic" voiceName="Atlas" sceneCount={5} targetDuration={30}
      firstImageUrl={undefined}
      audioState={{ phase: 'error', message: 'Failed' }}
      videoState={{ phase: 'idle' }}
      onRetryAudio={onRetryAudio} onRetryVideo={vi.fn()} onReset={vi.fn()}
    />
  );
  expect(screen.getByRole('button', { name: /retry audio/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npm test -- VideoStep
```
Expected: FAIL

- [ ] **Step 3: Create `VideoStep.tsx`**

```typescript
import { Loader2, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GenerateAudioState, GenerateVideoState } from '../types';

export type VideoStepProps = {
  artStyleLabel: string;
  voiceName: string;
  sceneCount: number;
  targetDuration: number;
  firstImageUrl: string | undefined;
  audioState: GenerateAudioState;
  videoState: GenerateVideoState;
  onRetryAudio: () => void;
  onRetryVideo: () => void;
  onReset: () => void;
};

type PipelinePhase = 'audio' | 'video' | 'done' | 'error-audio' | 'error-video';

function getPhase(audio: GenerateAudioState, video: GenerateVideoState): PipelinePhase {
  if (audio.phase === 'error') return 'error-audio';
  if (video.phase === 'error') return 'error-video';
  if (video.phase === 'completed') return 'done';
  if (audio.phase === 'completed') return 'video';
  return 'audio';
}

export const VideoStep = ({
  artStyleLabel, voiceName, sceneCount, targetDuration,
  firstImageUrl, audioState, videoState, onRetryAudio, onRetryVideo, onReset,
}: VideoStepProps) => {
  const phase = getPhase(audioState, videoState);
  const isGenerating = phase === 'audio' || phase === 'video';
  const videoUrl = videoState.phase === 'completed' ? videoState.videoUrl : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-head text-[32px] font-extrabold tracking-[-0.04em]">Render your video</h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">
          Review your choices, then generate the final vertical video.
        </p>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {/* Summary card */}
        <div className="flex-1 divide-y divide-border rounded-2xl border border-border bg-card">
          {[
            { label: 'ART STYLE', value: artStyleLabel },
            { label: 'VOICE',     value: voiceName },
            { label: 'SCENES',    value: `${sceneCount} · ~${targetDuration}s` },
            { label: 'FORMAT',    value: '9:16 · 1080×1920' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-3 px-5 py-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground w-20 shrink-0">{label}</span>
              <span className="text-[15px] font-bold text-foreground">{value}</span>
            </div>
          ))}
        </div>

        {/* Phone mockup */}
        <div className="mx-auto flex w-[160px] shrink-0 flex-col items-center">
          <div className="relative w-full overflow-hidden rounded-[24px] border-4 border-foreground/20 bg-elev shadow-2xl" style={{ aspectRatio: '9/16' }}>
            {firstImageUrl ? (
              <img src={firstImageUrl} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-elev2" />
            )}
            {isGenerating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <span className="text-[11px] font-semibold text-white/80">
                  {phase === 'audio' ? 'Generating audio…' : 'Generating video…'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error states */}
      {phase === 'error-audio' && (
        <div className="flex items-center justify-between rounded-xl border border-destructive/40 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{(audioState as { message: string }).message}</p>
          <Button variant="outline" size="sm" onClick={onRetryAudio}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry audio
          </Button>
        </div>
      )}

      {phase === 'error-video' && (
        <div className="flex items-center justify-between rounded-xl border border-destructive/40 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{(videoState as { message: string }).message}</p>
          <Button variant="outline" size="sm" onClick={onRetryVideo}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry video
          </Button>
        </div>
      )}

      {/* Done state */}
      {phase === 'done' && videoUrl && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-acc-soft p-5">
          <p className="text-[15px] font-semibold text-foreground">Your video is ready!</p>
          <div className="flex gap-2">
            <Button asChild>
              <a href={videoUrl} download aria-label="Download video">
                <Download className="mr-1.5 h-4 w-4" /> Download
              </a>
            </Button>
            <Button variant="outline" onClick={onReset}>Start over</Button>
          </div>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test -- VideoStep
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/generation/components/VideoStep.tsx \
        frontend/src/features/generation/components/VideoStep.test.tsx
git commit -m "feat(frontend): add VideoStep with summary, phone mockup, and pipeline status"
```

---

## Task 14: Frontend — GenerationFlow orchestrator

**Files:**
- Create: `frontend/src/features/generation/components/GenerationFlow.tsx`
- Create: `frontend/src/features/generation/components/GenerationFlow.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// GenerationFlow.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GenerationFlow } from './GenerationFlow';

vi.mock('../hooks/useGenerateScript', () => ({ useGenerateScript: () => ({ state: { phase: 'idle' }, generate: vi.fn(), reset: vi.fn() }) }));
vi.mock('../hooks/useGenerateImages', () => ({ useGenerateImages: () => ({ state: { phase: 'idle' }, generate: vi.fn(), reset: vi.fn() }) }));
vi.mock('../hooks/useGenerateAudio',  () => ({ useGenerateAudio:  () => ({ state: { phase: 'idle' }, generate: vi.fn(), reset: vi.fn() }) }));
vi.mock('../hooks/useGenerateVideo',  () => ({ useGenerateVideo:  () => ({ state: { phase: 'idle' }, generate: vi.fn(), reset: vi.fn() }) }));

it('renders StoryStep on initial load', () => {
  render(<GenerationFlow onStepChange={vi.fn()} />);
  expect(screen.getByText(/turn any story into/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npm test -- GenerationFlow
```
Expected: FAIL

- [ ] **Step 3: Create `GenerationFlow.tsx`**

```typescript
import { useCallback, useEffect, useState } from 'react';
import { StoryStep } from './StoryStep';
import { ScriptStep } from './ScriptStep';
import { StyleStep } from './StyleStep';
import { VoiceStep } from './VoiceStep';
import { VideoStep } from './VideoStep';
import { parseScenes } from '../utils/parseScript';
import { useGenerateScript } from '../hooks/useGenerateScript';
import { useGenerateImages } from '../hooks/useGenerateImages';
import { useGenerateAudio } from '../hooks/useGenerateAudio';
import { useGenerateVideo } from '../hooks/useGenerateVideo';
import type { StoryStyle, WizardStep } from '../types';

export type GenerationFlowProps = {
  onStepChange: (step: WizardStep) => void;
};

export const GenerationFlow = ({ onStepChange }: GenerationFlowProps) => {
  const [step, setStep] = useState<WizardStep>('story');
  const [story, setStory] = useState('');
  const [tone, setTone] = useState('playful');
  const [targetDuration, setTargetDuration] = useState(30);
  const [style, setStyle] = useState<StoryStyle | null>(null);
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [scriptJobId, setScriptJobId] = useState<string | null>(null);
  const [imageJobId, setImageJobId] = useState<string | null>(null);
  const [audioJobId, setAudioJobId] = useState<string | null>(null);

  const { state: scriptState, generate: generateScript, reset: resetScript } = useGenerateScript();
  const { state: imagesState, generate: generateImages, reset: resetImages } = useGenerateImages();
  const { state: audioState, generate: generateAudio, reset: resetAudio } = useGenerateAudio();
  const { state: videoState, generate: generateVideo, reset: resetVideo } = useGenerateVideo();

  const navigate = useCallback((next: WizardStep) => {
    setStep(next);
    onStepChange(next);
  }, [onStepChange]);

  // Sync job IDs from polling states
  useEffect(() => { if (scriptState.phase === 'polling') setScriptJobId(scriptState.jobId); }, [scriptState]);
  useEffect(() => { if (imagesState.phase === 'polling') setImageJobId(imagesState.jobId); }, [imagesState]);
  useEffect(() => { if (audioState.phase === 'polling') setAudioJobId(audioState.jobId); }, [audioState]);

  // Auto-trigger images when style is selected (on style step)
  const handleStyleChange = (next: StoryStyle) => {
    setStyle(next);
    if (scriptJobId) {
      resetImages();
      generateImages(scriptJobId, next);
    }
  };

  // Auto-trigger audio when video step mounts
  useEffect(() => {
    if (step === 'video' && scriptJobId && voiceId && audioState.phase === 'idle') {
      generateAudio(scriptJobId, voiceId);
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-trigger video when audio completes
  useEffect(() => {
    if (audioState.phase === 'completed' && imageJobId && audioJobId && videoState.phase === 'idle') {
      generateVideo(imageJobId, audioJobId);
    }
  }, [audioState.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerateScript = () => {
    navigate('script');
    generateScript(story, targetDuration, undefined, tone);
  };

  const handleRetryScript = () => { resetScript(); setScriptJobId(null); };

  const handleReset = () => {
    resetScript(); resetImages(); resetAudio(); resetVideo();
    setStory(''); setStyle(null); setVoiceId(null);
    setScriptJobId(null); setImageJobId(null); setAudioJobId(null);
    navigate('story');
  };

  const sceneCount = scriptState.phase === 'completed' ? parseScenes(scriptState.script).length : targetDuration / 6;
  const artStyleLabel = style
    ? style.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : '';
  const voiceName = voiceId ? voiceId.charAt(0).toUpperCase() + voiceId.slice(1) : '';
  const firstImageUrl = imagesState.phase === 'completed' ? imagesState.imageUrls[0] : undefined;

  return (
    <div className="mx-auto max-w-3xl px-6 pb-16 pt-10 sm:px-8">
      {step === 'story' && (
        <StoryStep
          story={story} onStoryChange={setStory}
          tone={tone} onToneChange={setTone}
          targetDuration={targetDuration} onDurationChange={setTargetDuration}
          onGenerate={handleGenerateScript}
          isGenerating={scriptState.phase === 'submitting' || scriptState.phase === 'polling'}
        />
      )}

      {step === 'script' && (
        <ScriptStep
          state={scriptState}
          onRegenerate={() => { handleRetryScript(); handleGenerateScript(); }}
          onContinue={() => navigate('style')}
        />
      )}

      {step === 'style' && (
        <StyleStep
          value={style}
          onChange={handleStyleChange}
          imagesState={imagesState}
          sceneCount={Math.round(sceneCount)}
          onContinue={() => navigate('voice')}
        />
      )}

      {step === 'voice' && (
        <VoiceStep
          value={voiceId}
          onChange={setVoiceId}
          onContinue={() => navigate('video')}
        />
      )}

      {step === 'video' && (
        <VideoStep
          artStyleLabel={artStyleLabel}
          voiceName={voiceName}
          sceneCount={Math.round(sceneCount)}
          targetDuration={targetDuration}
          firstImageUrl={firstImageUrl}
          audioState={audioState}
          videoState={videoState}
          onRetryAudio={() => { resetAudio(); if (scriptJobId && voiceId) generateAudio(scriptJobId, voiceId); }}
          onRetryVideo={() => { resetVideo(); if (imageJobId && audioJobId) generateVideo(imageJobId, audioJobId); }}
          onReset={handleReset}
        />
      )}
    </div>
  );
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test -- GenerationFlow
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/generation/components/GenerationFlow.tsx \
        frontend/src/features/generation/components/GenerationFlow.test.tsx
git commit -m "feat(frontend): add GenerationFlow orchestrator with 5-step navigation and auto-triggers"
```

---

## Task 15: Frontend — Simplify GeneratePage

**Files:**
- Modify: `frontend/src/features/generation/routes/GeneratePage.tsx`

- [ ] **Step 1: Rewrite `GeneratePage.tsx`**

Replace the entire file:

```typescript
import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { CreateStepsNav } from '../components/CreateStepsNav';
import { GenerationFlow } from '../components/GenerationFlow';
import type { WizardStep } from '../types';

const CRUMBS: Record<WizardStep, string> = {
  story:  'Create / Story',
  script: 'Create / Script',
  style:  'Create / Style',
  voice:  'Create / Voice',
  video:  'Create / Video',
};

export function GeneratePage() {
  const [currentStep, setCurrentStep] = useState<WizardStep>('story');

  return (
    <AppShell
      crumb={CRUMBS[currentStep]}
      steps={<CreateStepsNav currentStep={currentStep} />}
    >
      <GenerationFlow onStepChange={setCurrentStep} />
    </AppShell>
  );
}
```

- [ ] **Step 2: Run full test suite to verify no regressions**

```bash
cd frontend && npm test
```
Expected: All passing (hook tests unchanged; deleted component tests will no longer run).

- [ ] **Step 3: Build to check for TypeScript errors**

```bash
cd frontend && npm run build
```
Expected: Exit 0, no type errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/generation/routes/GeneratePage.tsx
git commit -m "refactor(frontend): simplify GeneratePage to AppShell + GenerationFlow"
```

---

## Task 16: Cleanup — Delete old components

**Files to delete:**
- `frontend/src/features/generation/components/GenerationWizard.tsx`
- `frontend/src/features/generation/components/GenerationWizard.test.tsx`
- `frontend/src/features/generation/components/stages/ImagesStage.tsx`
- `frontend/src/features/generation/components/stages/AudioStage.tsx`
- `frontend/src/features/generation/components/stages/VideoStage.tsx`
- `frontend/src/features/generation/components/stages/ScriptStage.tsx`
- `frontend/src/features/generation/components/stages/ScriptStage.test.tsx`
- `frontend/src/features/generation/components/StyleSelector.tsx`
- `frontend/src/features/generation/components/StyleSelector.test.tsx`
- `frontend/src/features/generation/components/VoiceSelector.tsx`
- `frontend/src/features/generation/components/VoiceSelector.test.tsx`
- `frontend/src/features/generation/components/ScriptReviewStep.tsx`
- `frontend/src/features/generation/components/DurationSelect.tsx`
- `frontend/src/features/generation/components/DurationSelect.test.tsx`
- `frontend/src/features/generation/components/DurationSelector.tsx`
- `frontend/src/features/generation/components/ScenesSelect.tsx`
- `frontend/src/features/generation/components/ScenesSelect.test.tsx`
- `frontend/src/features/generation/components/ScenesSelector.tsx`

- [ ] **Step 1: Delete old files**

```bash
cd frontend/src/features/generation/components
rm GenerationWizard.tsx GenerationWizard.test.tsx
rm StyleSelector.tsx StyleSelector.test.tsx
rm VoiceSelector.tsx VoiceSelector.test.tsx
rm ScriptReviewStep.tsx
rm DurationSelect.tsx DurationSelect.test.tsx DurationSelector.tsx
rm ScenesSelect.tsx ScenesSelect.test.tsx ScenesSelector.tsx
rm stages/ImagesStage.tsx stages/AudioStage.tsx stages/VideoStage.tsx
rm stages/ScriptStage.tsx stages/ScriptStage.test.tsx
```

On Windows PowerShell:
```powershell
$base = "frontend/src/features/generation/components"
@(
  "GenerationWizard.tsx","GenerationWizard.test.tsx",
  "StyleSelector.tsx","StyleSelector.test.tsx",
  "VoiceSelector.tsx","VoiceSelector.test.tsx",
  "ScriptReviewStep.tsx",
  "DurationSelect.tsx","DurationSelect.test.tsx","DurationSelector.tsx",
  "ScenesSelect.tsx","ScenesSelect.test.tsx","ScenesSelector.tsx",
  "stages/ImagesStage.tsx","stages/AudioStage.tsx","stages/VideoStage.tsx",
  "stages/ScriptStage.tsx","stages/ScriptStage.test.tsx"
) | ForEach-Object { Remove-Item "$base/$_" -Force }
```

- [ ] **Step 2: Run build to confirm no dangling imports**

```bash
cd frontend && npm run build
```
Expected: Exit 0. If there are import errors, trace the import and remove or update it.

- [ ] **Step 3: Run tests to confirm clean**

```bash
cd frontend && npm test
```
Expected: All tests passing.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(frontend): remove old wizard, stages, and selector components"
```
