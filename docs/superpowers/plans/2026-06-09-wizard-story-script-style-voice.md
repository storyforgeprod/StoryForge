# Wizard Step Reorder: Story → Script → Style → Voice — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the GenerationWizard so script generation and review appear as step 2 (between story input and style selection), with duration/scenes as `<Select>` controls in the story step and style removed from `POST /generate/script`.

**Architecture:** The wizard's step order changes from `story→style→duration→scenes→script→voice` to `story→script→style→voice`. Duration and scenes become `<Select>` controls inside the story step, managed as internal wizard state. Style is removed from `GenerateScriptDto` and the frontend API layer (it already isn't used by the backend service logic). The existing `ScriptReviewStep` component is reused as-is for the script step.

**Tech Stack:** React 18, TypeScript strict, shadcn/ui Select, Tailwind, Vitest + RTL (frontend); NestJS + class-validator (backend)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `backend/src/generate/dto/generate-script.dto.ts` | Modify | Remove `style` field from DTO |
| `frontend/src/features/generation/api/generateApi.ts` | Modify | Remove `style` from `postGenerateScript` body type |
| `frontend/src/features/generation/hooks/useGenerateScript.ts` | Modify | Remove `style` param from `generate()` |
| `frontend/src/features/generation/hooks/useGenerateScript.test.ts` | Modify | Update calls to `generate()` — remove `'anime'` arg |
| `frontend/src/features/generation/components/DurationSelect.tsx` | Create | Select for 30/45/60/90/120s options |
| `frontend/src/features/generation/components/DurationSelect.test.tsx` | Create | RTL tests for DurationSelect |
| `frontend/src/features/generation/components/ScenesSelect.tsx` | Create | Select for 3/5/7/10/12 scenes options |
| `frontend/src/features/generation/components/ScenesSelect.test.tsx` | Create | RTL tests for ScenesSelect |
| `frontend/src/features/generation/components/GenerationWizard.tsx` | Modify | New step order + new props contract |
| `frontend/src/features/generation/components/GenerationWizard.test.tsx` | Modify | Tests for new wizard flow |
| `frontend/src/features/generation/routes/GeneratePage.tsx` | Modify | Update `handleGenerateScript`, remove `targetDuration`/`targetScenes` state |

---

## Task 1: Remove `style` from `GenerateScriptDto` (backend)

**Files:**
- Modify: `backend/src/generate/dto/generate-script.dto.ts`

- [ ] **Step 1: Remove the `style` field from the DTO**

Replace the full content of `backend/src/generate/dto/generate-script.dto.ts`:

```ts
import { IsString, IsNotEmpty, MaxLength, MinLength, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateScriptDto {
  @ApiProperty({
    description: 'Story text to convert to script',
    example: 'Once upon a time...',
    minLength: 50,
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(50, { message: 'Story must be at least 50 characters' })
  @MaxLength(5000, { message: 'Story must not exceed 5000 characters' })
  story!: string;

  @ApiProperty({
    description: 'Target video duration in seconds (30-120s, default 60s)',
    example: 60,
    minimum: 30,
    maximum: 120,
  })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(120)
  targetDuration?: number;

  @ApiProperty({
    description: 'Target number of scenes (1-12, default 12)',
    example: 12,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  targetScenes?: number;
}

export class GenerateScriptResponseDto {
  @ApiProperty({ description: 'Job ID for tracking generation status', example: 'job_abc123' })
  jobId!: string;

  @ApiProperty({
    description: 'Current job status',
    enum: ['pending', 'processing', 'completed', 'failed'],
    example: 'pending',
  })
  status!: 'pending' | 'processing' | 'completed' | 'failed';

  @ApiProperty({ description: 'Status message', example: 'Script generation queued' })
  message!: string;

  @ApiProperty({ description: 'Target duration for video', example: 60, required: false })
  targetDuration?: number;

  @ApiProperty({ description: 'Generation timestamp', required: false })
  createdAt?: Date;

  @ApiProperty({
    description: 'Generated script (null if still processing)',
    example: 'Scene 1: Establishing shot...',
    required: false,
  })
  script?: string | null;

  @ApiProperty({ description: 'Error message if job failed', required: false })
  error?: string | null;
}
```

- [ ] **Step 2: Verify backend build passes**

```bash
cd backend && npm run build
```
Expected: EXIT 0, no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add backend/src/generate/dto/generate-script.dto.ts
git commit -m "feat: remove style from GenerateScriptDto — style only affects image generation"
```

---

## Task 2: Remove `style` from the frontend API layer

**Files:**
- Modify: `frontend/src/features/generation/api/generateApi.ts`
- Modify: `frontend/src/features/generation/hooks/useGenerateScript.ts`
- Modify: `frontend/src/features/generation/hooks/useGenerateScript.test.ts`

- [ ] **Step 1: Update `postGenerateScript` in `generateApi.ts`**

Change lines 1 and 35–43 of `frontend/src/features/generation/api/generateApi.ts`.

Line 1 — update import (remove `StoryStyle`):
```ts
import type { ImageGenerationResult, AudioGenerationResult } from '../types';
```

Lines 35–43 — update function signature:
```ts
export async function postGenerateScript(
    body: { story: string; targetDuration?: number; targetScenes?: number },
): Promise<{ jobId: string; status: string; createdAt: string }> {
    const res = await fetch(`${API_BASE}/generate/script`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
    });
    return handleResponse(res);
}
```

- [ ] **Step 2: Update `useGenerateScript.ts`**

In `frontend/src/features/generation/hooks/useGenerateScript.ts`, make these changes:

Lines 1–3 — update imports (remove `StoryStyle`):
```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { postGenerateScript, getJobStatus } from '../api/generateApi';
import type { GenerateScriptState } from '../types';
```

Lines 5–9 — update `UseGenerateScriptReturn` type:
```ts
export type UseGenerateScriptReturn = {
    state: GenerateScriptState;
    generate: (story: string, targetDuration?: number, targetScenes?: number) => void;
    reset: () => void;
};
```

Lines 11–15 — update error map (remove style-related 400 message):
```ts
const ERROR_MAP: Record<number, string> = {
    400: 'Revisá el texto ingresado.',
    401: 'Tu sesión expiró. Volvé a iniciar sesión.',
    429: 'Límite alcanzado. Intentá en un minuto.',
};
```

Lines 96–108 — update `generate` callback:
```ts
const generate = useCallback(
    async (story: string, targetDuration?: number, targetScenes?: number) => {
        setState({ phase: 'submitting' });
        try {
            const { jobId } = await postGenerateScript({ story, targetDuration, targetScenes });
            setState({ phase: 'polling', jobId, attempts: 0 });
            startPolling(jobId);
        } catch (err) {
            setState({ phase: 'error', message: mapApiError(err) });
        }
    },
    [startPolling],
);
```

- [ ] **Step 3: Update `useGenerateScript.test.ts`**

All calls to `result.current.generate('My story', 'anime')` must drop the `'anime'` argument. There are 7 such calls in the file (lines 41, 70–71, 87–88, 109, 133, 158, 188–189).

Change every occurrence of:
```ts
result.current.generate('My story', 'anime');
```
to:
```ts
result.current.generate('My story');
```

- [ ] **Step 4: Run the hook tests to verify they pass**

```bash
cd frontend && npm test -- useGenerateScript
```
Expected: PASS (8 tests).

- [ ] **Step 5: Run frontend build**

```bash
cd frontend && npm run build
```
Expected: EXIT 0.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features/generation/api/generateApi.ts frontend/src/features/generation/hooks/useGenerateScript.ts frontend/src/features/generation/hooks/useGenerateScript.test.ts
git commit -m "feat: remove style from script generation — frontend API and hook"
```

---

## Task 3: `DurationSelect` component (TDD)

**Files:**
- Create: `frontend/src/features/generation/components/DurationSelect.test.tsx`
- Create: `frontend/src/features/generation/components/DurationSelect.tsx`

- [ ] **Step 1: Write failing tests**

Create `frontend/src/features/generation/components/DurationSelect.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DurationSelect } from './DurationSelect';

describe('DurationSelect', () => {
    it('renders the current value as selected', () => {
        render(<DurationSelect value={60} onChange={vi.fn()} />);
        expect(screen.getByRole('combobox')).toHaveTextContent('60 segundos');
    });

    it('calls onChange with a numeric value when an option is selected', async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        render(<DurationSelect value={60} onChange={onChange} />);

        await user.click(screen.getByRole('combobox'));
        await user.click(screen.getByRole('option', { name: '30 segundos' }));

        expect(onChange).toHaveBeenCalledWith(30);
    });

    it('renders all 5 duration options', async () => {
        const user = userEvent.setup();
        render(<DurationSelect value={60} onChange={vi.fn()} />);

        await user.click(screen.getByRole('combobox'));

        expect(screen.getByRole('option', { name: '30 segundos' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '45 segundos' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '60 segundos' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '90 segundos' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '120 segundos' })).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npm test -- DurationSelect
```
Expected: FAIL — `Cannot find module './DurationSelect'`.

- [ ] **Step 3: Implement `DurationSelect`**

Create `frontend/src/features/generation/components/DurationSelect.tsx`:

```tsx
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const DURATION_OPTIONS = [
    { value: 30, label: '30 segundos' },
    { value: 45, label: '45 segundos' },
    { value: 60, label: '60 segundos' },
    { value: 90, label: '90 segundos' },
    { value: 120, label: '120 segundos' },
];

export type DurationSelectProps = {
    value: number;
    onChange: (value: number) => void;
};

export const DurationSelect = ({ value, onChange }: DurationSelectProps) => (
    <div className="space-y-1.5">
        <label className="text-sm font-medium">Duración</label>
        <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
            <SelectTrigger>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {DURATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    </div>
);
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test -- DurationSelect
```
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/generation/components/DurationSelect.tsx frontend/src/features/generation/components/DurationSelect.test.tsx
git commit -m "feat: add DurationSelect component"
```

---

## Task 4: `ScenesSelect` component (TDD)

**Files:**
- Create: `frontend/src/features/generation/components/ScenesSelect.test.tsx`
- Create: `frontend/src/features/generation/components/ScenesSelect.tsx`

- [ ] **Step 1: Write failing tests**

Create `frontend/src/features/generation/components/ScenesSelect.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScenesSelect } from './ScenesSelect';

describe('ScenesSelect', () => {
    it('renders the current value as selected', () => {
        render(<ScenesSelect value={5} onChange={vi.fn()} />);
        expect(screen.getByRole('combobox')).toHaveTextContent('5 escenas');
    });

    it('calls onChange with a numeric value when an option is selected', async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        render(<ScenesSelect value={5} onChange={onChange} />);

        await user.click(screen.getByRole('combobox'));
        await user.click(screen.getByRole('option', { name: '3 escenas' }));

        expect(onChange).toHaveBeenCalledWith(3);
    });

    it('renders all 5 scenes options', async () => {
        const user = userEvent.setup();
        render(<ScenesSelect value={5} onChange={vi.fn()} />);

        await user.click(screen.getByRole('combobox'));

        expect(screen.getByRole('option', { name: '3 escenas' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '5 escenas' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '7 escenas' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '10 escenas' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '12 escenas' })).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npm test -- ScenesSelect
```
Expected: FAIL — `Cannot find module './ScenesSelect'`.

- [ ] **Step 3: Implement `ScenesSelect`**

Create `frontend/src/features/generation/components/ScenesSelect.tsx`:

```tsx
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const SCENES_OPTIONS = [
    { value: 3, label: '3 escenas' },
    { value: 5, label: '5 escenas' },
    { value: 7, label: '7 escenas' },
    { value: 10, label: '10 escenas' },
    { value: 12, label: '12 escenas' },
];

export type ScenesSelectProps = {
    value: number;
    onChange: (value: number) => void;
};

export const ScenesSelect = ({ value, onChange }: ScenesSelectProps) => (
    <div className="space-y-1.5">
        <label className="text-sm font-medium">Escenas</label>
        <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
            <SelectTrigger>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {SCENES_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    </div>
);
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test -- ScenesSelect
```
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/generation/components/ScenesSelect.tsx frontend/src/features/generation/components/ScenesSelect.test.tsx
git commit -m "feat: add ScenesSelect component"
```

---

## Task 5: Refactor `GenerationWizard` — new step order (TDD)

**Files:**
- Modify: `frontend/src/features/generation/components/GenerationWizard.test.tsx`
- Modify: `frontend/src/features/generation/components/GenerationWizard.tsx`

- [ ] **Step 1: Replace `GenerationWizard.test.tsx` with updated tests**

Replace the entire file `frontend/src/features/generation/components/GenerationWizard.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GenerationWizard } from './GenerationWizard';
import { StoryStyle } from '../types';

const validStory = 'a'.repeat(60);

function makeProps(overrides: Partial<React.ComponentProps<typeof GenerationWizard>> = {}) {
    return {
        story: '',
        onStoryChange: vi.fn(),
        style: null,
        onStyleChange: vi.fn(),
        voiceId: null,
        onVoiceChange: vi.fn(),
        isDeveloper: false,
        genState: { phase: 'idle' as const },
        onGenerateScript: vi.fn(),
        onRetryScript: vi.fn(),
        onStartPipeline: vi.fn(),
        onOpenScriptPreset: vi.fn(),
        ...overrides,
    };
}

describe('GenerationWizard', () => {
    it('starts on the story step', () => {
        render(<GenerationWizard {...makeProps()} />);
        expect(screen.getByText('Tu historia')).toBeInTheDocument();
    });

    it('shows Duración and Escenas selects on the story step', () => {
        render(<GenerationWizard {...makeProps()} />);
        expect(screen.getByText('Duración')).toBeInTheDocument();
        expect(screen.getByText('Escenas')).toBeInTheDocument();
    });

    it('disables "Generar guión" when the story is invalid', () => {
        render(<GenerationWizard {...makeProps({ story: 'too short' })} />);
        expect(screen.getByRole('button', { name: /generar guión/i })).toBeDisabled();
    });

    it('fires onGenerateScript with duration and scenes, then shows script step', async () => {
        const user = userEvent.setup();
        const onGenerateScript = vi.fn();
        render(<GenerationWizard {...makeProps({ story: validStory, onGenerateScript })} />);

        await user.click(screen.getByRole('button', { name: /generar guión/i }));

        expect(onGenerateScript).toHaveBeenCalledTimes(1);
        expect(onGenerateScript).toHaveBeenCalledWith(expect.any(Number), expect.any(Number));
        expect(screen.getByText('Tu guión')).toBeInTheDocument();
    });

    it('disables continue on script step while genState is not completed', async () => {
        const user = userEvent.setup();
        render(
            <GenerationWizard
                {...makeProps({
                    story: validStory,
                    genState: { phase: 'polling', jobId: 'job1', attempts: 1 },
                })}
            />,
        );

        await user.click(screen.getByRole('button', { name: /generar guión/i }));

        expect(screen.getByRole('button', { name: /continuar/i })).toBeDisabled();
    });

    it('enables continue on script step when genState is completed', async () => {
        const user = userEvent.setup();
        render(
            <GenerationWizard
                {...makeProps({
                    story: validStory,
                    genState: {
                        phase: 'completed',
                        script: 'Scene 1: Intro (5s)\n[Sound: Hello]',
                    },
                })}
            />,
        );

        await user.click(screen.getByRole('button', { name: /generar guión/i }));

        expect(screen.getByRole('button', { name: /continuar/i })).not.toBeDisabled();
    });

    it('advances script → style → voice when each step is valid', async () => {
        const user = userEvent.setup();
        render(
            <GenerationWizard
                {...makeProps({
                    story: validStory,
                    style: StoryStyle.ANIME,
                    voiceId: 'voice1',
                    genState: {
                        phase: 'completed',
                        script: 'Scene 1: Intro (5s)\n[Sound: Hello]',
                    },
                })}
            />,
        );

        await user.click(screen.getByRole('button', { name: /generar guión/i }));
        expect(screen.getByText('Tu guión')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /continuar/i }));
        expect(screen.getByText('Estilo visual')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /continuar/i }));
        expect(screen.getByText('Voz y narrador')).toBeInTheDocument();
    });

    it('disables style-step continue when no style is selected', async () => {
        const user = userEvent.setup();
        render(
            <GenerationWizard
                {...makeProps({
                    story: validStory,
                    style: null,
                    genState: {
                        phase: 'completed',
                        script: 'Scene 1: Intro (5s)\n[Sound: Hello]',
                    },
                })}
            />,
        );

        await user.click(screen.getByRole('button', { name: /generar guión/i }));
        await user.click(screen.getByRole('button', { name: /continuar/i }));

        expect(screen.getByRole('button', { name: /continuar/i })).toBeDisabled();
    });

    it('fires onStartPipeline when "Generar video" is clicked with voice selected', async () => {
        const user = userEvent.setup();
        const onStartPipeline = vi.fn();
        render(
            <GenerationWizard
                {...makeProps({
                    story: validStory,
                    style: StoryStyle.ANIME,
                    voiceId: 'voice1',
                    genState: {
                        phase: 'completed',
                        script: 'Scene 1: Intro (5s)\n[Sound: Hello]',
                    },
                    onStartPipeline,
                })}
            />,
        );

        await user.click(screen.getByRole('button', { name: /generar guión/i }));
        await user.click(screen.getByRole('button', { name: /continuar/i }));
        await user.click(screen.getByRole('button', { name: /continuar/i }));
        await user.click(screen.getByRole('button', { name: /generar video/i }));

        expect(onStartPipeline).toHaveBeenCalledTimes(1);
    });

    it('disables "Generar video" when no voice is selected', async () => {
        const user = userEvent.setup();
        render(
            <GenerationWizard
                {...makeProps({
                    story: validStory,
                    style: StoryStyle.ANIME,
                    voiceId: null,
                    genState: {
                        phase: 'completed',
                        script: 'Scene 1: Intro (5s)\n[Sound: Hello]',
                    },
                })}
            />,
        );

        await user.click(screen.getByRole('button', { name: /generar guión/i }));
        await user.click(screen.getByRole('button', { name: /continuar/i }));
        await user.click(screen.getByRole('button', { name: /continuar/i }));

        expect(screen.getByRole('button', { name: /generar video/i })).toBeDisabled();
    });

    it('calls onRetryScript and returns to story step when back is pressed on script step', async () => {
        const user = userEvent.setup();
        const onRetryScript = vi.fn();
        render(<GenerationWizard {...makeProps({ story: validStory, onRetryScript })} />);

        await user.click(screen.getByRole('button', { name: /generar guión/i }));
        expect(screen.getByText('Tu guión')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /atrás/i }));

        expect(onRetryScript).toHaveBeenCalledTimes(1);
        expect(screen.getByText('Tu historia')).toBeInTheDocument();
    });

    it('walks back through all steps', async () => {
        const user = userEvent.setup();
        render(
            <GenerationWizard
                {...makeProps({
                    story: validStory,
                    style: StoryStyle.ANIME,
                    genState: {
                        phase: 'completed',
                        script: 'Scene 1: Intro (5s)\n[Sound: Hello]',
                    },
                })}
            />,
        );

        await user.click(screen.getByRole('button', { name: /generar guión/i }));
        await user.click(screen.getByRole('button', { name: /continuar/i }));
        await user.click(screen.getByRole('button', { name: /continuar/i }));
        expect(screen.getByText('Voz y narrador')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /atrás/i }));
        expect(screen.getByText('Estilo visual')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /atrás/i }));
        expect(screen.getByText('Tu guión')).toBeInTheDocument();
    });

    it('shows preset button on script step only when developer', async () => {
        const user = userEvent.setup();
        const { rerender } = render(
            <GenerationWizard {...makeProps({ story: validStory, isDeveloper: false })} />,
        );

        await user.click(screen.getByRole('button', { name: /generar guión/i }));
        expect(screen.queryByRole('button', { name: /usar preset/i })).not.toBeInTheDocument();

        rerender(<GenerationWizard {...makeProps({ story: validStory, isDeveloper: true })} />);
        expect(screen.getByRole('button', { name: /usar preset/i })).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npm test -- GenerationWizard
```
Expected: Multiple FAILs — props mismatch (old wizard has `targetDuration`, `genState` prop shape mismatch, etc.).

- [ ] **Step 3: Replace `GenerationWizard.tsx` with the new implementation**

Replace the full content of `frontend/src/features/generation/components/GenerationWizard.tsx`:

```tsx
import { useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { StoryInput } from './StoryInput';
import { StyleSelector } from './StyleSelector';
import { VoiceSelector } from './VoiceSelector';
import { DurationSelect } from './DurationSelect';
import { ScenesSelect } from './ScenesSelect';
import { ScriptReviewStep } from './ScriptReviewStep';
import { validateStory } from '../utils/validation';
import type { GenerateScriptState, StoryStyle } from '../types';

type WizardStep = 'story' | 'script' | 'style' | 'voice';

export type GenerationWizardProps = {
    story: string;
    onStoryChange: (story: string) => void;
    style: StoryStyle | null;
    onStyleChange: (style: StoryStyle) => void;
    voiceId: string | null;
    onVoiceChange: (voiceId: string) => void;
    isDeveloper: boolean;
    genState: GenerateScriptState;
    onGenerateScript: (duration: number, scenes: number) => void;
    onRetryScript: () => void;
    onStartPipeline: () => void;
    onOpenScriptPreset: () => void;
};

const STEP_COPY: Record<WizardStep, { title: string; description: string; number: number }> = {
    story: {
        title: 'Tu historia',
        description: 'Pegá el texto que querés convertir en un Short y configurá la duración y escenas.',
        number: 1,
    },
    script: {
        title: 'Tu guión',
        description: 'Revisá las escenas generadas. Podés regenerar si algo no quedó bien.',
        number: 2,
    },
    style: {
        title: 'Estilo visual',
        description: 'Elegí el estilo visual que mejor refleja tu historia.',
        number: 3,
    },
    voice: {
        title: 'Voz y narrador',
        description: 'Elegí la voz que narrará tu historia.',
        number: 4,
    },
};

export const GenerationWizard = ({
    story,
    onStoryChange,
    style,
    onStyleChange,
    voiceId,
    onVoiceChange,
    isDeveloper,
    genState,
    onGenerateScript,
    onRetryScript,
    onStartPipeline,
    onOpenScriptPreset,
}: GenerationWizardProps) => {
    const [step, setStep] = useState<WizardStep>('story');
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [targetDuration, setTargetDuration] = useState(60);
    const [targetScenes, setTargetScenes] = useState(12);
    const validation = useMemo(() => validateStory(story), [story]);
    const copy = STEP_COPY[step];
    const isScriptGenerating = genState.phase === 'submitting' || genState.phase === 'polling';

    const handleGenerateScript = () => {
        setSubmitAttempted(true);
        if (!validation.valid) return;
        onGenerateScript(targetDuration, targetScenes);
        setStep('script');
    };

    const handleRegenerate = () => {
        onRetryScript();
        onGenerateScript(targetDuration, targetScenes);
    };

    const handleBack = () => {
        if (step === 'script') {
            onRetryScript();
            setStep('story');
        }
        if (step === 'style') setStep('script');
        if (step === 'voice') setStep('style');
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>{copy.title}</CardTitle>
                        <CardDescription>{copy.description}</CardDescription>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                        <div className="font-semibold">Paso {copy.number} de 4</div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {step === 'story' && (
                    <>
                        <StoryInput
                            value={story}
                            onChange={onStoryChange}
                            showErrors={submitAttempted}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <DurationSelect value={targetDuration} onChange={setTargetDuration} />
                            <ScenesSelect value={targetScenes} onChange={setTargetScenes} />
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs text-muted-foreground">
                                {validation.valid
                                    ? 'Texto listo para continuar.'
                                    : 'Completá el texto para habilitar el siguiente paso.'}
                            </p>
                            <Button
                                type="button"
                                disabled={!validation.valid}
                                onClick={handleGenerateScript}
                            >
                                Generar guión
                            </Button>
                        </div>
                    </>
                )}

                {step === 'script' && (
                    <>
                        <ScriptReviewStep
                            state={genState}
                            onRegenerate={handleRegenerate}
                        />
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={isScriptGenerating}
                                onClick={handleBack}
                            >
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Atrás
                            </Button>
                            <div className="flex gap-2">
                                {isDeveloper && genState.phase !== 'completed' && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={onOpenScriptPreset}
                                    >
                                        Usar preset
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    disabled={genState.phase !== 'completed'}
                                    onClick={() => setStep('style')}
                                >
                                    Continuar
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {step === 'style' && (
                    <>
                        <StyleSelector value={style} onChange={onStyleChange} />
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <Button type="button" variant="outline" onClick={handleBack}>
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Atrás
                            </Button>
                            <Button
                                type="button"
                                disabled={!style}
                                onClick={() => setStep('voice')}
                            >
                                Continuar
                            </Button>
                        </div>
                    </>
                )}

                {step === 'voice' && (
                    <>
                        <VoiceSelector value={voiceId} onChange={onVoiceChange} />
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <Button type="button" variant="outline" onClick={handleBack}>
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Atrás
                            </Button>
                            <Button
                                type="button"
                                disabled={!voiceId}
                                onClick={onStartPipeline}
                            >
                                Generar video
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test -- GenerationWizard
```
Expected: PASS (all 12 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/generation/components/GenerationWizard.tsx frontend/src/features/generation/components/GenerationWizard.test.tsx
git commit -m "feat: restructure wizard to story→script→style→voice; duration/scenes as selects"
```

---

## Task 6: Update `GeneratePage` to match new wizard props

**Files:**
- Modify: `frontend/src/features/generation/routes/GeneratePage.tsx`

- [ ] **Step 1: Remove `targetDuration` and `targetScenes` state**

Remove lines 28–29 from `GeneratePage.tsx`:
```ts
const [targetDuration, setTargetDuration] = useState(60);
const [targetScenes, setTargetScenes] = useState(12);
```

- [ ] **Step 2: Update `handleGenerateScript`**

Replace the existing `handleGenerateScript` function (around line 61):
```ts
const handleGenerateScript = (duration: number, scenes: number) => {
    if (genState.phase === 'completed' && story === lastScriptStory) return;
    setLastScriptStory(story);
    generate(story, duration, scenes);
};
```

- [ ] **Step 3: Remove `handleRegenerateScript`**

Delete the entire `handleRegenerateScript` function (the wizard handles regeneration internally now):
```ts
// DELETE this entire block:
const handleRegenerateScript = () => {
    if (!style) return;
    resetGeneration();
    setScriptJobId(null);
    setLastScriptStory(story);
    generate(story, style, targetDuration, targetScenes);
};
```

- [ ] **Step 4: Update the `<GenerationWizard>` JSX**

Replace the `<GenerationWizard ...>` call (around line 174) with:
```tsx
<GenerationWizard
    story={story}
    onStoryChange={setStory}
    style={style}
    onStyleChange={setStyle}
    voiceId={voiceId}
    onVoiceChange={setVoiceId}
    isDeveloper={isDeveloper}
    genState={genState}
    onGenerateScript={handleGenerateScript}
    onRetryScript={handleRetryScript}
    onStartPipeline={handleGenerateImages}
    onOpenScriptPreset={() => setPresetDialog('script')}
/>
```

- [ ] **Step 5: Build and run all tests**

```bash
cd frontend && npm run build && npm test
```
Expected: BUILD EXIT 0, all tests pass.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features/generation/routes/GeneratePage.tsx
git commit -m "feat: update GeneratePage for new wizard contract"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ New screen between story paste and style selection
- ✅ Script generation triggered from story step
- ✅ Scene list displayed via existing `ScriptReviewStep` (shows narration + on-screen text per scene)
- ✅ Duration and scenes configured as selects in story step
- ✅ Style removed from `POST /generate/script` (backend + frontend)
- ✅ Thumbnails are placeholders (dark square + scene number — existing `ScriptReviewStep` behavior)
- ✅ Regenerate all button remains functional

**Type consistency:**
- `onGenerateScript: (duration: number, scenes: number) => void` — used identically in wizard (Task 5), GeneratePage (Task 6), and tests (Task 5)
- `GenerationWizardProps` in Task 5 matches what GeneratePage passes in Task 6

**No placeholders:** All code blocks contain complete implementations.
