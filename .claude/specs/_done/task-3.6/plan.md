# Technical Plan: Visual Style Selector — Task 3.6

## High-Level Architecture

```
Generate.tsx  (wizard orchestrator — step state lives here)
  └── step === 'style'
        └── StyleSelector
              ├── StyleCard × 4  (anime | manga | webtoon | novel)
              └── onSelect: (style: StoryStyle) => void
```

`StyleSelector` is a controlled, stateless component. All wizard step transitions and state aggregation live in `Generate.tsx`.

## Components Affected

| Component | Change Type | Notes |
|-----------|-------------|-------|
| `frontend/src/components/StyleSelector/StyleSelector.tsx` | New | Controlled card-grid selector |
| `frontend/src/types/generate.ts` | New | Frontend mirror of `StoryStyle` enum |
| `frontend/src/pages/Generate.tsx` | Modified | Add `style` state; render StyleSelector at step 2; gate Continue button |

## Architecture Decision Records

### ADR-1: Mirror `StoryStyle` enum on the frontend

- **Context:** The backend defines `StoryStyle` in a NestJS DTO. The frontend needs the same four string literals.
- **Decision:** Declare an identical `as const` object in `frontend/src/types/generate.ts` and keep it manually in sync.
- **Rationale:** No shared monorepo type package exists for MVP; a direct copy is lowest friction.
- **Trade-offs:** Drift risk if backend enum changes. Mitigated by having a single file as the frontend source of truth.

### ADR-2: Card-grid layout, not a dropdown

- **Context:** Users need to understand visual differences between genres at a glance.
- **Decision:** 2×2 card grid; each card has icon + label + 1-line description.
- **Rationale:** Visual affordance matches the product's creative nature; consistent with shadcn/ui `Card` already in use.
- **Trade-offs:** Slightly more markup; acceptable for exactly 4 fixed options.

### ADR-3: Controlled component — no internal state

- **Context:** `Generate.tsx` needs the selected style to gate Continue and submit to the API.
- **Decision:** `StyleSelector` receives `value` + `onChange` props; zero internal state.
- **Rationale:** Same controlled pattern as `StoryInput`; all wizard state in one place.
- **Trade-offs:** None for MVP scope.

## Data Model Changes

None. This is a pure frontend UI component; no DB or API schema changes.

## Component API

```ts
// frontend/src/types/generate.ts
export const StoryStyle = {
  ANIME:   'anime',
  MANGA:   'manga',
  WEBTOON: 'webtoon',
  NOVEL:   'novel',
} as const;
export type StoryStyle = typeof StoryStyle[keyof typeof StoryStyle];
```

```ts
// frontend/src/components/StyleSelector/StyleSelector.tsx
export type StyleSelectorProps = {
  value: StoryStyle | null;
  onChange: (style: StoryStyle) => void;
  disabled?: boolean;
};

type StyleOption = {
  value: StoryStyle;
  label: string;
  description: string;
  icon: string;
};

const STYLE_OPTIONS: StyleOption[] = [
  { value: 'anime',   label: 'Anime',   description: 'Colores vibrantes, expresión dramática',  icon: '⚡' },
  { value: 'manga',   label: 'Manga',   description: 'Blanco y negro, alto contraste',           icon: '🖤' },
  { value: 'webtoon', label: 'Webtoon', description: 'Paleta suave, scroll vertical',             icon: '🎨' },
  { value: 'novel',   label: 'Novela',  description: 'Ilustración detallada, cinematográfico',    icon: '📖' },
];
```

## Generate.tsx Changes (step wiring)

```ts
// New state
const [style, setStyle] = useState<StoryStyle | null>(null);
type WizardStep = 'story' | 'style' | 'voice';
const [step, setStep] = useState<WizardStep>('story');

// Step 1 → 2 transition (existing handleContinue)
const handleContinue = () => {
  if (step === 'story') { setSubmitAttempted(true); if (!validation.valid) return; setStep('style'); }
  if (step === 'style') { if (!style) return; setStep('voice'); }
};

// Continue button gate
const canContinue =
  (step === 'story' && validation.valid) ||
  (step === 'style' && style !== null);
```

## API Contracts

`StyleSelector` does not call any API. The selected `style` is stored in `Generate.tsx` and sent to `POST /generate/script` in Task 3.8.

**POST /generate/script body (Task 3.8 reference):**
```json
{ "story": "string", "style": "anime | manga | webtoon | novel" }
```

## Security Considerations

- No auth at component level; JWT guard enforced by the backend on submission.
- Input is constrained to enum literals — no free-text accepted from the user.

## Performance Considerations

- Zero network calls; 4 static options rendered inline.
- No memoization or lazy loading needed.

## Observability

- No metrics for MVP.
- PostHog `style_selected` event can be added in Task 5.6 (analytics sprint).
