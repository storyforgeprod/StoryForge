# Scenes Count Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `sceneCount` Select control to `StoryStep` so the user's choice is passed to the backend instead of always defaulting to 12.

**Architecture:** New state in `GenerationFlow` → new props on `StoryStep` → new Select rendered next to Tone and Length → value forwarded as third arg to `generateScript`.

**Tech Stack:** React 18, TypeScript strict, shadcn `<Select>`, Vitest + Testing Library.

---

### Task 1: Update `StoryStep` props and add the Select

**Files:**
- Modify: `frontend/src/features/generation/components/StoryStep.tsx`

- [ ] **Step 1: Add `SCENES` constant and extend `StoryStepProps`**

Open `StoryStep.tsx`. Add the constant after `LENGTHS` and extend the props type:

```tsx
const SCENES = [
  { value: 4,  label: '4 scenes' },
  { value: 5,  label: '5 scenes' },
  { value: 6,  label: '6 scenes' },
  { value: 7,  label: '7 scenes' },
  { value: 8,  label: '8 scenes' },
  { value: 10, label: '10 scenes' },
  { value: 12, label: '12 scenes' },
];
```

In `StoryStepProps`, add:

```ts
sceneCount: number;
onSceneCountChange: (v: number) => void;
```

- [ ] **Step 2: Destructure the new props and render the Select**

Add `sceneCount` and `onSceneCountChange` to the destructuring at the top of the component, then add a third `<Select>` in the controls `div` (after the Length select):

```tsx
<Select
  value={String(sceneCount)}
  onValueChange={(v) => onSceneCountChange(Number(v))}
>
  <SelectTrigger className="h-8 w-auto gap-1 rounded-full border-border bg-elev px-3 text-[13px]">
    <span className="text-muted-foreground">Scenes:&nbsp;</span>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    {SCENES.map((s) => (
      <SelectItem key={s.value} value={String(s.value)}>{s.label}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

---

### Task 2: Wire `sceneCount` state in `GenerationFlow`

**Files:**
- Modify: `frontend/src/features/generation/components/GenerationFlow.tsx`

- [ ] **Step 1: Add `sceneCount` state**

After the `targetDuration` state line, add:

```tsx
const [sceneCount, setSceneCount] = useState(5);
```

- [ ] **Step 2: Pass props to `StoryStep`**

In the `StoryStep` JSX block, add the two new props:

```tsx
sceneCount={sceneCount} onSceneCountChange={setSceneCount}
```

- [ ] **Step 3: Fix the `generateScript` call**

Change line 69 from:

```tsx
generateScript(story, targetDuration, undefined, tone);
```

to:

```tsx
generateScript(story, targetDuration, sceneCount, tone);
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd frontend && npx tsc -b --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/generation/components/StoryStep.tsx \
        frontend/src/features/generation/components/GenerationFlow.tsx
git commit -m "feat(frontend): add scenes count selector to StoryStep"
```

---

### Task 3: Update tests

**Files:**
- Modify: `frontend/src/features/generation/components/StoryStep.test.tsx`

- [ ] **Step 1: Add `sceneCount` to the `base` fixture**

The `base` object is missing the two new required props. Add them:

```ts
const base = {
  story: '',
  onStoryChange: vi.fn(),
  tone: 'playful',
  onToneChange: vi.fn(),
  targetDuration: 30,
  onDurationChange: vi.fn(),
  sceneCount: 5,
  onSceneCountChange: vi.fn(),
  onGenerate: vi.fn(),
  isGenerating: false,
};
```

- [ ] **Step 2: Run existing tests — they should still pass**

```bash
cd frontend && npm test -- --run StoryStep
```

Expected: 4 tests pass.

- [ ] **Step 3: Add test for the scenes Select**

Append a new test after the existing four:

```tsx
it('calls onSceneCountChange when a scene option is selected', async () => {
  const onSceneCountChange = vi.fn();
  render(<StoryStep {...base} onSceneCountChange={onSceneCountChange} />);

  // Open the Scenes select — find trigger by its label text
  const trigger = screen.getByText(/scenes/i).closest('button')!;
  fireEvent.click(trigger);

  // Pick "8 scenes" from the dropdown
  const option = await screen.findByRole('option', { name: /8 scenes/i });
  fireEvent.click(option);

  expect(onSceneCountChange).toHaveBeenCalledWith(8);
});
```

- [ ] **Step 4: Run all tests**

```bash
cd frontend && npm test -- --run StoryStep
```

Expected: 5 tests pass.

- [ ] **Step 5: Run the full test suite**

```bash
cd frontend && npm test -- --run
```

Expected: all tests pass, no regressions.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features/generation/components/StoryStep.test.tsx
git commit -m "test(frontend): update StoryStep tests for scenes count selector"
```
