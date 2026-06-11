# Scenes Count Selector — Design

**Date:** 2026-06-11

## Problem

`GenerationFlow` passes `undefined` as `targetScenes` to `generateScript`, so the backend always defaults to 12 scenes regardless of the video length selected by the user.

## Solution

Add a `<Select>` for scene count in `StoryStep`, wire it through `GenerationFlow`, and pass it to the existing `generateScript` call.

## Affected files

| File | Change |
|------|--------|
| `frontend/src/features/generation/components/StoryStep.tsx` | New `sceneCount` + `onSceneCountChange` props; new Select control |
| `frontend/src/features/generation/components/GenerationFlow.tsx` | New `sceneCount` state; pass to `generateScript` |
| `frontend/src/features/generation/components/StoryStep.test.tsx` | Update render props; add selector test |

## Design

### State

- `sceneCount: number` in `GenerationFlow`, default `5` (matches current implicit `30s / 6`).

### Select options

`[4, 5, 6, 7, 8, 10, 12]` — backend accepts 1–12; 4 is minimum for a coherent narrative.

### Props added to `StoryStepProps`

```ts
sceneCount: number;
onSceneCountChange: (v: number) => void;
```

### Call site

```ts
// GenerationFlow.tsx
generateScript(story, targetDuration, sceneCount, tone);
// was: generateScript(story, targetDuration, undefined, tone);
```

## Out of scope

- Backend changes (DTO, service, prompt already support `targetScenes`)
- Hook / API changes (already accept `targetScenes`)
- Deriving `sceneCount` from `targetDuration` automatically (user controls both independently)
