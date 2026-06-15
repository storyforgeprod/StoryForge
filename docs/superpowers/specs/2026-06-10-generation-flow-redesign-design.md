# Generation Flow Redesign — Design Doc

**Date:** 2026-06-10
**Status:** Approved

## Goal

Replace the current `GenerationWizard` + `ImagesStage` + `AudioStage` + `VideoStage` architecture with a new full-page 5-step flow (`GenerationFlow`) that matches the prototype screens exactly.

---

## Architecture

### Orchestrator: `GenerationFlow`

Single component at `features/generation/components/GenerationFlow.tsx` that owns all wizard state and pipeline logic. `GeneratePage` renders only `AppShell` + `<GenerationFlow />`.

**State owned by `GenerationFlow`:**
- `step: 'story' | 'script' | 'style' | 'voice' | 'video'`
- `story: string`
- `tone: string` (Playful | Dramatic | Suspenseful | Energetic)
- `targetDuration: number`
- `style: StoryStyle | null`
- `voiceId: string | null`
- `scriptJobId: string | null`
- `imageJobId: string | null`
- `audioJobId: string | null`
- All generation hook instances

**Hooks reused without changes:**
`useGenerateScript`, `useGenerateImages`, `useGenerateAudio`, `useGenerateVideo`

### Components removed
- `GenerationWizard`
- `ImagesStage`
- `AudioStage`
- `VideoStage`

### Components kept / adapted
- `StoryInput` — reused as-is
- `ScriptReviewStep` — adapted as `ScriptStep`
- `StyleThumb` — updated with 6 new style values
- `VoiceSelector` — updated with 5 new voices + static preview URLs
- `CreateStepsNav` — updated to 5 steps
- `PipelineProgress` — reused in `VideoStep`

---

## Steps

### 01 STORY (`StoryStep`)
- Full-width textarea for story text
- Two pill selects in the bottom bar:
  - **Tone**: Playful / Dramatic / Suspenseful / Energetic → sent as `tone` in `GenerateScriptDto`
  - **Length**: 30s / 60s / 90s → maps to `targetDuration`
- Three "Try:" example prompt buttons that fill the textarea
- "Generate script" button → navigates to `'script'` and fires `useGenerateScript`

### 02 SCRIPT (`ScriptStep`)
- Header: "Your script" + "N scenes · ~Xs" (inline scene editing is out of scope)
- List of scene cards: scene number badge + narration text + on-screen text (subtitle)
- "Regenerate all" button (top right)
- "Continue" button enabled only when `genState.phase === 'completed'`
- Error state: inline error + "Retry" button; cannot advance until script is ready

### 03 STYLE (`StyleStep`)
- "Pick your art style" header
- 6 style cards in a 2–3 column grid:
  - Bold Comic, Soft Cartoon, Retro Pop, Manga Ink, Storybook, 3D Toon
- On style select → auto-fires `useGenerateImages(scriptJobId, style)`
- If user changes style while images are loading → reset hook + re-fire with new style
- `ScenePreviewRow` appears below the grid after a style is selected:
  - Skeleton cards while images are loading
  - Each skeleton replaced by the real image as it arrives
- "Continue" enabled immediately on style selection (does not wait for images)
- Error state: inline error + "Retry images" button; "Continue" remains available

### 04 VOICE (`VoiceStep`)
- "Choose a voice" header, "Press play to preview, then select your narrator" subtitle
- 5 voice options:
  | ID    | Name  | Tag       | Description                        |
  |-------|-------|-----------|------------------------------------|
  | nova  | Nova  | Energetic | Bright, fast — perfect for hooks   |
  | atlas | Atlas | Deep      | Calm, cinematic narrator           |
  | lumi  | Lumi  | Friendly  | Warm, conversational, gen-z        |
  | rex   | Rex   | Hype      | Loud, punchy sports-caster         |
  | sage  | Sage  | Soft      | Gentle ASMR-style whisper          |
- Play button → loads static file from `public/voices/<id>.mp3`
- EQ animation while playing (reuses existing animate-eq logic)
- Only one voice plays at a time
- "Continue" enabled on voice selection

### 05 VIDEO (`VideoStep`)
- "Render your video" header
- Summary card (left): Art Style, Voice, Scenes (~Xs), Format (9:16 · 1080×1920)
- Phone mockup (right): shows first generated image or placeholder
- On mount → auto-fires `useGenerateAudio(scriptJobId, voiceId)` → on audio complete → auto-fires `useGenerateVideo(imageJobId, audioJobId)`
- Progress indicator inline: "Generating audio…" → "Generating video…" → "Done"
- On completion: download button + "Start over" button
- Error states:
  - Audio fail → "Audio generation failed" + "Retry audio" button
  - Video fail → "Video generation failed" + "Retry video" button

---

## Backend Changes

### `GenerateScriptDto`
Add optional field `tone?: string`. Injected into Azure OpenAI prompt as narration style directive.

### `StoryStyle` enum
Replace current values (`anime`, `manga`, `novel`, `webtoon`) with:
`bold-comic`, `soft-cartoon`, `retro-pop`, `manga-ink`, `storybook`, `3d-toon`

Update `GenerateImagesDto` validation and image generation prompts accordingly.

### Voice ID mapping
Internal IDs (`nova`, `atlas`, `lumi`, `rex`, `sage`) map to real ElevenLabs voice IDs in the backend service. Frontend never references ElevenLabs IDs directly.

### Static voice previews
Pre-recorded `.mp3` files per voice in `frontend/public/voices/`. One-time download from ElevenLabs, zero per-play cost.

---

## Error Handling

| Step   | Failure                  | UX response                                      |
|--------|--------------------------|--------------------------------------------------|
| Script | Generation fails         | Inline error + Retry. Cannot advance.            |
| Style  | Image generation fails   | Inline error + Retry images. Continue available. |
| Video  | Audio generation fails   | Inline error + Retry audio.                      |
| Video  | Video generation fails   | Inline error + Retry video.                      |

---

## Testing

- All existing hook tests (`useGenerateScript`, `useGenerateImages`, `useGenerateAudio`, `useGenerateVideo`) remain unchanged.
- `GenerationWizard.test.tsx`, `ImagesStage` tests, `AudioStage` tests, `VideoStage` tests → deleted alongside their components.
- New tests per step component: `StoryStep.test.tsx`, `ScriptStep.test.tsx`, `StyleStep.test.tsx`, `VoiceStep.test.tsx`, `VideoStep.test.tsx`.
- Each test covers: render, key interactions, error states.
