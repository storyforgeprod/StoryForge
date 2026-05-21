# Tasks: Visual Style Selector — Task 3.6

## Summary

Total tasks: 4 | Estimated effort: S (< 2h)

## Checklist

- [ ] TASK-3.6-01: Create `StoryStyle` frontend type
- [ ] TASK-3.6-02: Build `StyleSelector` component
- [ ] TASK-3.6-03: Wire `StyleSelector` into `Generate.tsx` as step 2
- [ ] TASK-3.6-04: Unit tests for `StyleSelector`

---

## Layer: Frontend / UI

### TASK-3.6-01: Create `StoryStyle` frontend type

**Layer:** Frontend — Types
**Size:** S
**Depends on:** none
**Description:** Create `frontend/src/types/generate.ts` exporting a `StoryStyle` `as const` object and its derived type. Values must exactly match the backend `StoryStyle` enum: `anime`, `manga`, `webtoon`, `novel`.
**Inputs:** `backend/src/generate/dto/generate-script.dto.ts` (enum source of truth)
**Output / Done when:** File exists; TypeScript compiles without errors; all four values are exported.

---

### TASK-3.6-02: Build `StyleSelector` component

**Layer:** Frontend — Component
**Size:** S
**Depends on:** TASK-3.6-01
**Description:** Create `frontend/src/components/StyleSelector/StyleSelector.tsx`. Render a 2×2 grid of cards using shadcn/ui `Card`. Each card shows icon + label + description. Controlled via `value` / `onChange` props. Selected card gets a highlighted border (`ring-2 ring-primary`). Keyboard accessible: `role="radio"` on each card, `role="radiogroup"` on the container.
**Inputs:** `StyleSelectorProps` from plan.md; `STYLE_OPTIONS` static data from plan.md; existing `Card` component at `frontend/src/components/ui/card.tsx`
**Output / Done when:** Component renders 4 cards; clicking one calls `onChange` with correct enum value; selected card is visually distinct; tab + enter works in browser.

---

### TASK-3.6-03: Wire `StyleSelector` into `Generate.tsx` as step 2

**Layer:** Frontend — Integration
**Size:** S
**Depends on:** TASK-3.6-02
**Description:** In `Generate.tsx`: add `style` state (`StoryStyle | null`), add `WizardStep` type, convert current single-card layout into a step-aware render. At step `'story'`, show `StoryInput` (unchanged). At step `'style'`, show `StyleSelector`. The Continue button advances the step; it is disabled while `style === null`. Add a step indicator (e.g. "Paso 2 de 3") above the card.
**Inputs:** Existing `Generate.tsx`; `StyleSelector` from TASK-3.6-02; `style` state
**Output / Done when:** Clicking Continue on step 1 transitions to step 2; selecting a style enables Continue; Continue advances to step 3 (placeholder for 3.7); no TypeScript errors; `npm run build` EXIT 0.

---

### TASK-3.6-04: Unit tests for `StyleSelector`

**Layer:** Testing
**Size:** S
**Depends on:** TASK-3.6-02
**Description:** Vitest + React Testing Library tests. Cover: renders 4 options; clicking an option calls `onChange` with correct value; selected option has accessible `aria-checked="true"`; no option selected → `onChange` not called for unrelated clicks.
**Inputs:** `StyleSelector` component; RTL `render`, `fireEvent`
**Output / Done when:** All tests pass; covers AC-1, AC-2, AC-7.

---

## Task Dependency Map

```
TASK-3.6-01 → TASK-3.6-02 → TASK-3.6-03
                    ↓
              TASK-3.6-04
```
