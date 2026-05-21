# Technical Plan: Voice Selector — Task 3.7

## High-Level Architecture

```
Generate.tsx  (wizard orchestrator)
  └── step === 'voice'
        └── VoiceSelector
              ├── VoiceCard × N  (static list, ≥ 2 voices)
              │     └── <audio> preview element per card
              └── onSelect: (voiceId: string) => void
```

Voice list is static data in the component. No API call at render time.

## Components Affected

| Component | Change Type | Notes |
|-----------|-------------|-------|
| `frontend/src/components/VoiceSelector/VoiceSelector.tsx` | New | Controlled voice card list |
| `frontend/src/types/generate.ts` | Modified | Add `VoiceOption` type |
| `frontend/src/pages/Generate.tsx` | Modified | Add `voiceId` state; render VoiceSelector at step 3; final submit trigger |

## Architecture Decision Records

### ADR-1: Static voice list, no API call on render

- **Context:** `ElevenLabsService.getAvailableVoices()` is a stub in the backend. Fetching at render time adds latency and a dependency.
- **Decision:** Hard-code ≥ 2 voice options in `VOICE_OPTIONS` constant inside the component file.
- **Rationale:** MVP; avoids network latency and a half-implemented backend stub call.
- **Trade-offs:** Adding a new voice requires a frontend deploy. Acceptable for MVP scale.

### ADR-2: HTML `<audio>` element for preview, not Web Audio API

- **Context:** Simple playback of a short clip; no manipulation needed.
- **Decision:** Each `VoiceCard` renders a hidden `<audio>` ref; clicking Play calls `audioRef.current.play()`.
- **Rationale:** Zero dependency on external library; native browser support.
- **Trade-offs:** Pause logic must be manual (pause all other cards when one plays). Handled with a shared `playingId` state in `VoiceSelector`.

### ADR-3: `voiceId` stored in Generate.tsx, not submitted to `/generate/script`

- **Context:** `POST /generate/script` DTO does not accept a `voiceId` field — it only takes `story` and `style`. The voice is used later by `POST /generate/audio`.
- **Decision:** Store `voiceId` in `Generate.tsx` state for forward-passing to the audio step (Task 4.x).
- **Rationale:** Aligns with existing backend contract; no backend changes needed.
- **Trade-offs:** State must persist across steps; handled by keeping it in the parent page component.

## Data Model Changes

None. Pure frontend.

## Component API

```ts
// Addition to frontend/src/types/generate.ts
export type VoiceOption = {
  id: string;         // ElevenLabs voice ID
  name: string;       // Display name
  description: string;
  previewUrl: string; // URL to short audio clip (≤5s)
};
```

```ts
// frontend/src/components/VoiceSelector/VoiceSelector.tsx
export type VoiceSelectorProps = {
  value: string | null;      // selected voiceId
  onChange: (voiceId: string) => void;
  disabled?: boolean;
};

// Static voice catalogue (IDs to be confirmed before implementation)
const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: 'EXAVITQu4vr4xnSDxMaL',          // ElevenLabs "Sarah" (default in backend)
    name: 'Sarah',
    description: 'Voz femenina, cálida y dramática',
    previewUrl: '/audio/preview-sarah.mp3', // hosted in Supabase Storage or public folder
  },
  {
    id: 'TX3LPaxmHKxFdv7VOQHJ',           // ElevenLabs "Liam" (example)
    name: 'Liam',
    description: 'Voz masculina, épica y profunda',
    previewUrl: '/audio/preview-liam.mp3',
  },
];
```

## Generate.tsx Changes (step 3 wiring)

```ts
// New state
const [voiceId, setVoiceId] = useState<string | null>(null);

// Extend handleContinue / handleGenerate
if (step === 'voice') {
  if (!voiceId) return;
  handleGenerateScript(); // Task 3.8
}

// Final button gate
const canGenerate = step === 'voice' && voiceId !== null;
```

## API Contracts

`VoiceSelector` does not call any API. The `voiceId` is stored in `Generate.tsx` and forwarded:
- To `POST /generate/audio` body in Task 4.1: `{ scriptId, voiceId }`
- Not sent to `POST /generate/script` (backend doesn't accept it there)

## Security Considerations

- `voiceId` is a constrained string from a static list; no free-text user input.
- Audio preview URLs should be on a trusted origin (Supabase Storage with public bucket, or bundled in `public/`).

## Performance Considerations

- Audio previews are short (≤ 5s). Prefetch is not necessary.
- Only one `<audio>` plays at a time — managed by `playingId` state inside `VoiceSelector`.

## Observability

- No metrics for MVP.
- PostHog `voice_selected` event can be added in Task 5.6.
- If preview playback fails, an inline error message is shown (AC-7).
