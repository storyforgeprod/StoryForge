# Spec: Voice Selector — Task 3.7

## User Story

**As a** content creator generating a narrated short-form video,
**I want** to pick a voice from a predefined library before generating my script,
**So that** the narration tone matches my story's genre and atmosphere.

## Context

Task 3.7 is step 3 of the 3-step generation wizard in `/app`. After choosing a visual style (step 2), the user selects a narrator voice. The selected `voiceId` is a static ElevenLabs voice ID stored on the frontend. It is NOT sent to `POST /generate/script` (that endpoint only takes `story` + `style`), but IS sent later to `POST /generate/audio` in the Task 4.x audio step. For MVP the voice selection is stored in Generate.tsx state and passed forward in the pipeline.

## Acceptance Criteria

| ID | Criteria (EARS format) |
|----|------------------------|
| AC-1 | The system shall display at least 2 voice options with clearly distinguishable tones (e.g. "Dramática femenina" vs "Épica masculina"). |
| AC-2 | Each voice option shall show a name, a short tone description, and a play/preview button. |
| AC-3 | When the user clicks the preview button, the system shall play a short audio sample (≤ 5 seconds) for that voice without navigating away. |
| AC-4 | When the user selects a voice, the system shall mark it as selected and deselect any previously selected voice. |
| AC-5 | While no voice is selected, the system shall keep the "Generar" button disabled. |
| AC-6 | When a voice is selected, the system shall enable the "Generar" button (final step trigger for Task 3.8). |
| AC-7 | If a voice preview fails to load, the system shall display an inline error without breaking the rest of the UI. |
| AC-8 | The component shall be keyboard-accessible: each option navigable with Tab and selectable with Enter or Space. |

## Out of Scope

- Fetching the voice list dynamically from ElevenLabs API at runtime (static list for MVP).
- Letting users upload or clone custom voices.
- Previewing full narration with the user's actual story text.
- More than 4 voice options for MVP.

## Assumptions

- ElevenLabs voice IDs to use will be confirmed by the developer before implementation; placeholder IDs are acceptable for local dev.
- Audio preview samples are short MP3/WebM files hosted in Supabase Storage or served as data URIs.
- `voiceId` from this step feeds `POST /generate/audio` in Task 4.x, NOT `POST /generate/script`.
- The wizard is a single-page multi-step flow — no URL changes.

## Open Questions

| # | Question | Owner | Status | Decision |
|---|----------|-------|--------|----------|
| 1 | Which specific ElevenLabs voice IDs should be offered? | Martin | Resolved | **2 voices: one male, one female.** Use placeholder IDs in dev; confirm real IDs before deploy. |
| 2 | Where should audio preview clips be hosted? (Supabase Storage vs. bundled static files) | Martin | Resolved | **No previews for MVP** — users select by label only. |
| 3 | Should the "Generar" button on step 3 be labelled "Generar guión" or "Generar video"? | Martin | Resolved | **"Generar guión"** — reflects the immediate next action in the pipeline. |

## Dependencies

- Task 3.6 ✅ (when complete) — StyleSelector wires the step transition into step 3
- ElevenLabs voice ID list — needed before final implementation
- Task 3.8 — API integration; VoiceSelector selection feeds the generate-script call and is stored for the audio step
