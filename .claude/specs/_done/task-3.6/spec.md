# Spec: Visual Style Selector — Task 3.6

## User Story

**As a** content creator generating a short-form video,
**I want** to choose a visual genre (anime, manga, webtoon, or novel) before generating my script,
**So that** the generated images and video are coherent with the universe of my story.

## Context

Task 3.6 is step 2 of the 3-step generation wizard in `/app`. The user has already validated their story text in step 1 (`StoryInput`). They now must pick one of four visual styles before advancing to step 3 (voice). The selected style value maps directly to the `StoryStyle` enum in the backend DTO and drives Replicate image-generation prompts downstream.

## Acceptance Criteria

| ID | Criteria (EARS format) |
|----|------------------------|
| AC-1 | The system shall display exactly four style options: `anime`, `manga`, `webtoon`, and `novel`. |
| AC-2 | When the user selects a style, the system shall mark that option as selected and deselect any previously selected option. |
| AC-3 | While no style is selected, the system shall keep the "Continuar" button disabled. |
| AC-4 | When a style is selected and the story text is valid, the system shall enable the "Continuar" button. |
| AC-5 | The system shall display each style with a label, a brief description of its visual tone, and a representative icon or placeholder. |
| AC-6 | The style value passed downstream shall be one of the exact strings: `anime` \| `manga` \| `webtoon` \| `novel` (matching `StoryStyle` enum). |
| AC-7 | The component shall be keyboard-accessible: each option navigable with Tab and selectable with Enter or Space. |

## Out of Scope

- Custom or user-uploaded style references.
- Real preview images from CDN (emoji/icon placeholders are acceptable for MVP).
- Persisting the selected style across sessions or browser refreshes.
- Adding styles beyond the current four.

## Assumptions

- The `StoryStyle` enum in the backend will not change during Week 3 development.
- Style visual indicators will be inline emoji or SVG placeholders; no external asset pipeline is required.
- The wizard is a single-page multi-step flow — no URL changes between steps.
- The selected style is held in `Generate.tsx` state and passed to the API in Task 3.8.
- **Canonical component path:** `frontend/src/components/StyleSelector/StyleSelector.tsx` (not `components/Style/`). The `StoryStyle` type lives in `frontend/src/types/generate.ts` (not `types/story.ts`).

## Open Questions

| # | Question | Owner | Status | Decision |
|---|----------|-------|--------|----------|
| 1 | Should each style card show a sample image, or only text + icon? | Martin | Resolved | **Text + icon only** — no image assets needed for MVP. |
| 2 | Is there a preferred display order for the 4 styles? | Martin | Resolved | **Alphabetical:** Anime → Manga → Novel → Webtoon. |

## Dependencies

- Task 3.5 ✅ — `StoryInput` + `validateStory` complete (step 1)
- `backend/src/generate/dto/generate-script.dto.ts` — `StoryStyle` enum source of truth
- Task 3.7 — VoiceSelector step depends on 3.6 advancing the wizard
- Task 3.8 — API integration consumes the selected style value
