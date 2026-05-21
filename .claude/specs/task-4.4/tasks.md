# Tasks: Real-Time Pipeline Progress Indicator — Task 4.4

## Summary

Total tasks: 3 | Estimated effort: M (≤ 3h)

## Checklist

- [ ] TASK-4.4-01: Build `PipelineProgress` component
- [ ] TASK-4.4-02: Integrate `PipelineProgress` into `Generate.tsx`
- [ ] TASK-4.4-03: Unit tests for `PipelineProgress`

---

## Layer: Frontend — Component

### TASK-4.4-01: Build `PipelineProgress` component

**Layer:** Frontend — Component
**Size:** S
**Depends on:** none
**Description:** Create `frontend/src/components/PipelineProgress/PipelineProgress.tsx`. Render 4 stage indicators horizontally. Each stage: an icon circle (pending=grey, active=blue+pulse, done=green+checkmark, error=red+X) and a label. Between stages, a connecting line that fills green when the previous stage is done. On mobile (< `sm:`), show icons only; labels on `sm:` and above.
**Inputs:** `PipelineProgressProps` from plan.md; Tailwind utilities; Lucide icons (`Check`, `X`, `Loader2`)
**Output / Done when:** All 4 status variants render correctly; responsive layout verified at 375px and 768px.

---

## Layer: Frontend — Integration

### TASK-4.4-02: Integrate `PipelineProgress` into `Generate.tsx`

**Layer:** Frontend — Integration
**Size:** S
**Depends on:** TASK-4.4-01, Tasks 3.8, 4.2, 4.3
**Description:** In `Generate.tsx`, implement `deriveStages(wizardPhase)` function that maps the current wizard phase to `PipelineStage[]`. Render `<PipelineProgress stages={...} />` inside the page header, below the navigation bar and above the main content `Card`. The indicator should be visible at all wizard phases including the initial story input.
**Inputs:** `PipelineProgress` from TASK-4.4-01; `wizardPhase` state in `Generate.tsx`; `deriveStages` mapping from plan.md
**Output / Done when:** Progress indicator visible and correct at every wizard phase; no layout regression in existing steps; `npm run build` EXIT 0.

---

## Layer: Testing

### TASK-4.4-03: Unit tests for `PipelineProgress`

**Layer:** Testing
**Size:** S
**Depends on:** TASK-4.4-01
**Description:** Vitest + RTL. Cover: renders 4 stage elements; `pending` stage has correct aria state; `active` stage shows loading icon; `done` stage shows check icon; `error` stage shows X icon; all 4 stage labels present on non-mobile render.
**Inputs:** `PipelineProgress` component
**Output / Done when:** All tests pass; covers AC-1, AC-2, AC-4, AC-6.

---

## Task Dependency Map

```
TASK-4.4-01 → TASK-4.4-02
                   ↓
             TASK-4.4-03
```
