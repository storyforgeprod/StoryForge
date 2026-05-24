# Task 3.5 — Implementation Plan

## Approach
Extract validation logic into a pure utility function. StoryInput is a controlled component that receives value + onChange from the parent form in Generate.tsx.

## Files created/modified
| File | Change |
|------|--------|
| `frontend/src/components/Input/StoryInput.tsx` | Textarea + counter + error display |
| `frontend/src/utils/validation.ts` | validateStory(text) → { valid, error } |
| `frontend/src/components/ui/textarea.tsx` | shadcn/ui base textarea component |
| `frontend/src/components/ui/label.tsx` | shadcn/ui accessible label |
| `frontend/src/pages/Generate.tsx` | Integrate StoryInput as step 1 of generation form |

## Validation rules (validation.ts)
```ts
const MIN = 50;
const MAX = 5000;
function validateStory(text: string): { valid: boolean; error?: string } {
  const trimmed = text.trim();
  if (trimmed.length < MIN) return { valid: false, error: `Mínimo ${MIN} caracteres` };
  if (trimmed.length > MAX) return { valid: false, error: `Máximo ${MAX} caracteres` };
  return { valid: true };
}
```

## UX behavior
- Error shown only after blur or submit attempt (not on every keystroke)
- Counter always visible (e.g. "342 / 5000")
- Button disabled while invalid
