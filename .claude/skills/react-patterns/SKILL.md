---
name: react-patterns
description: "React component and hook code patterns for StoryForge. Activate whenever the user writes or edits a React .tsx component, custom hook (useX.ts), or component/hook test — even when React or TypeScript are not explicitly mentioned (phrases like 'build the input', 'add the polling hook', 'show the loading state', 'fix the form'). Enforces: typed function components (no React.FC), discriminated-union hook state, useEffect cleanup, refs for non-render state, controlled props. Pairs additively with storyforge-frontend (which covers architecture, folder structure, Tailwind, and testing setup)."
---

# React Patterns — StoryForge

Code mechanics for React components and hooks. Architecture, folder layout, shadcn primitives, and testing setup live in [frontend/AGENTS.md](../../../frontend/AGENTS.md) and the `storyforge-frontend` skill — this file deliberately stays in the React/TS code itself.

The codebase is on React 18. Notes about React 19 are included where relevant for forward compatibility.

---

## Component declaration

Default form: named arrow function assigned to a `const` and exported. Sibling `type` for props destructured in the parameter list. Don't use `React.FC` — the original justifications (auto-typed children, JSX inference) have all been solved by modern TypeScript, and `FC` implicitly accepts `children` even when your component shouldn't.

```tsx
type StoryInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  showErrors?: boolean;
};

export const StoryInput = ({
  value,
  onChange,
  disabled = false,
  showErrors = false,
}: StoryInputProps) => (
  <Textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
  />
);
```

Notes:
- Use the concise arrow form `(props) => (<JSX />)` when the body is just returned JSX. Switch to a block body `(props) => { /* hooks, derived values */ return <JSX />; }` when the component has logic before the return.
- Defaults belong in the destructure (`disabled = false`), not in a separate `defaultProps` object. React 19 removed `defaultProps` for function components anyway.
- If a component needs `children`, declare it explicitly: `children: ReactNode`. Don't inherit it implicitly via `FC`.
- For ref forwarding, the form is the same arrow style wrapped in `forwardRef`: `const X = forwardRef<HTMLElement, Props>((props, ref) => ...);` and set `X.displayName = 'X'` for debuggability. (React 19: `ref` becomes a regular prop, no wrapper needed.)
- This is a component rule. Custom hooks remain `export function useX()` — the convention helps the reader tell components from hooks at a glance.

---

## Custom hooks for async work

Async work — fetches, polling, subscriptions — lives in a hook, not in the component. The hook returns a **discriminated union** describing the current phase. The discriminator (`phase`) lets TypeScript narrow which fields are present, and makes impossible states unrepresentable (e.g. you can't be in `completed` without a `script`).

```ts
type GenerateScriptState =
  | { phase: 'idle' }
  | { phase: 'submitting' }
  | { phase: 'polling'; jobId: string }
  | { phase: 'completed'; script: string }
  | { phase: 'error'; message: string };

export function useGenerateScript() {
  const [state, setState] = useState<GenerateScriptState>({ phase: 'idle' });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightRef = useRef(false);

  const clearPolling = useCallback(() => {
    inFlightRef.current = false;
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => clearPolling, [clearPolling]);

  const generate = useCallback(async (story: string, style: StoryStyle) => {
    if (inFlightRef.current) return;          // double-click guard
    inFlightRef.current = true;
    setState({ phase: 'submitting' });
    try {
      const { jobId } = await postGenerateScript({ story, style });
      setState({ phase: 'polling', jobId });
      // start interval; on completion or failure, call clearPolling + setState
    } catch (err) {
      inFlightRef.current = false;
      setState({ phase: 'error', message: mapApiError(err) });
    }
  }, []);

  const reset = useCallback(() => {
    clearPolling();
    setState({ phase: 'idle' });
  }, [clearPolling]);

  return { state, generate, reset };
}
```

Rules and the reasoning behind them:

- **One discriminated union, no parallel booleans.** A `phase: 'loading'` next to a separate `isLoading: true` lets the two drift out of sync. The discriminator is the only source of truth.
- **`useRef` for non-render mutable state.** Interval IDs, in-flight flags, AbortControllers, caches — these change without needing a re-render. `useState` for them causes spurious renders and stale-closure bugs.
- **Effect returns the cleanup function.** If a hook starts an interval / subscription / fetch, it must stop it on unmount. Without cleanup, unmounted components keep polling, race conditions multiply, and memory leaks accumulate.
- **In-flight guard at entry.** Without it, a double-click fires two POSTs and the second response races the first.
- **Hook surface stays small.** Export `{ state, action(...), reset }`. Internal refs and helpers don't leak — they make the hook hard to test and easy to misuse.
- **Errors map to user-readable messages inside the hook.** Components shouldn't know HTTP status codes.

For one-shot fetches (no polling), the same shape works without the interval ref — use an `AbortController` instead and abort in cleanup to avoid setState-after-unmount.

---

## Rendering by phase

Branch on the discriminator. TypeScript narrows automatically, so each branch can safely read the fields that exist in that phase. Prefer early returns to nested ternaries — they read top-to-bottom and the diff stays small when phases are added.

```tsx
const { state, generate, reset } = useGenerateScript();

if (state.phase === 'submitting' || state.phase === 'polling') {
  return <Loader />;
}
if (state.phase === 'error') {
  return <ErrorBanner message={state.message} onRetry={reset} />;
}
if (state.phase === 'completed') {
  return <ScriptView script={state.script} />;
}
return <StoryForm onSubmit={generate} />;
```

Avoid `value && <X />` when `value` could be `0`, `''`, or `NaN` — React will render the falsy value as text. Use `value != null && <X />` or an explicit `value ? <X /> : null`.

---

## Effects

- **Cleanup is mandatory** whenever the effect starts something with a lifetime (interval, subscription, listener, timeout, fetch). Return the cleanup function from the effect; don't try to clean up in unmount logic elsewhere.
- **Don't make the effect callback `async`.** Declare an inner async function and call it. An async effect returns a Promise, not a cleanup — React can't use that.
- **Don't omit dependencies to silence the lint rule.** If a dep makes the effect re-fire too often, the fix is restructuring (memoize, lift state, use a ref) — not lying about deps.
- **One concern per effect.** If an effect does two unrelated things, split it. Tests get easier, deps get smaller.

```tsx
useEffect(() => {
  let cancelled = false;
  async function load() {
    const data = await fetchVoices();
    if (!cancelled) setVoices(data);
  }
  load();
  return () => { cancelled = true; };
}, []);
```

---

## Memoization (`useMemo`, `useCallback`)

**Default: don't reach for them.** Both add memory and cognitive overhead, and the work they save is often less than the work they cost. Bare functions and re-computed values are fine for the vast majority of components. Reserve memoization for the specific cases below.

Use `useCallback` when:

- The function is a **dependency of another hook** (`useEffect`, `useMemo`, another `useCallback`). Without it, every render produces a new function reference and the dependent hook re-fires every render.
- The hook **exports the function** and consumers may put it in their own dep arrays. Custom hooks in this codebase wrap `generate`, `reset`, and internal helpers like `clearPolling` in `useCallback` for exactly this reason.
- The function is passed to a **`React.memo`-wrapped child** as a prop; a new reference each render defeats the memo.

Use `useMemo` when:

- The computation is **genuinely expensive** — large array transforms, deep object construction during render, regex against long strings.
- The result is a **referential dependency** elsewhere (effect deps, memoized child props). Primitives (string, number, boolean) never need this — React compares them by value.

```ts
// ✅ useCallback because clearPolling is a dep of the cleanup effect
const clearPolling = useCallback(() => {
  if (intervalRef.current !== null) clearInterval(intervalRef.current);
}, []);
useEffect(() => clearPolling, [clearPolling]);

// ✅ useMemo because validateStory walks a 5000-char string and the result
// drives the rendered branch on every keystroke
const validation = useMemo(() => validateStory(story), [story]);

// ❌ Pointless: result is a primitive, useMemo costs more than the work it saves
const isLong = useMemo(() => story.length > 1000, [story]);

// ❌ Pointless: function never crosses a memoization boundary
const handleClick = useCallback(() => setOpen(true), []);
// Just write: const handleClick = () => setOpen(true);
```

**React 19 forward-compat:** when the project upgrades, the React Compiler auto-memoizes most cases. Manual `useMemo`/`useCallback` becomes largely unnecessary, but the rules above still document intent for human readers — and the compiler makes any leftover wrong-cases harmless.

---

## Refs

Two distinct uses, both via `useRef`:

1. **DOM refs** — `useRef<HTMLDivElement>(null)`. Pass to the element's `ref` prop. Only read `ref.current` after mount (in an effect or event handler). Examples in this codebase: auto-scroll on stage completion.
2. **Mutable non-render values** — interval IDs, in-flight flags, AbortControllers, prior-value caches. These never trigger re-renders, which is exactly what you want for them.

Forwarding refs (React 18):

```tsx
type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn('...', className)} {...props} />
));
Input.displayName = 'Input';
```

On React 19, `ref` becomes a regular prop and `forwardRef` is unnecessary. Until then, use the wrapper.

---

## Props discipline

- **No `any` in props, state, or return types.** Use generics or unions; if you genuinely can't type something, narrow with `unknown` and a type guard.
- **Boolean props default to `false`.** Don't write `<X disabled={true} />` — write `<X disabled />`. The destructured default in the component reflects this.
- **Callbacks named `on<Event>`.** `onChange`, `onRetry`, `onSubmit`, `onClose`. Handlers inside the component named `handle<Event>`. This convention pays off when scanning a parent for the wiring of a child.
- **Avoid `children` unless the component is a true container** (Card, Dialog, layout shell). Specific slots (`header`, `footer`, `trailing`) are clearer than a single `children` slot for components with structured content.
- **Don't spread arbitrary props (`{...rest}`) past the boundary** unless the component is a primitive (Input, Button). It hides the prop surface and breaks refactors.

---

## Test-friendly design

Side effects live in hooks; components stay dumb and prop-driven. Tests render the component with mock callbacks and assert on rendered output. Tests for hooks live separately and exercise the state machine without rendering.

Avoid coupling tests to internal implementation:
- ✅ "After clicking 'Generate', the loader appears."
- ❌ "After clicking 'Generate', `setState` was called with `{ phase: 'submitting' }`."

Test setup, framework, and file location: see `storyforge-frontend`.

---

## Never do

- ❌ `React.FC` / `FC<Props>` — plain typed functions only.
- ❌ Parallel `isLoading` / `isError` booleans next to a `phase` union.
- ❌ Fetching inside a component — extract a hook.
- ❌ Mutating state directly (`state.items.push(x)`). React doesn't see it.
- ❌ Effects that start something without returning a cleanup.
- ❌ `async` directly on a `useEffect` callback.
- ❌ Omitting dependencies to silence `react-hooks/exhaustive-deps`.
- ❌ `any` in props, state, or hook return types.
- ❌ `console.log` of user objects, tokens, or full API responses — accidental token disclosure.
- ❌ Hard-coded keys in lists (`key={index}`) when items can reorder.
- ❌ Wrapping every function / value in `useMemo` / `useCallback` defensively — they cost more than they save unless they cross a memoization boundary.
