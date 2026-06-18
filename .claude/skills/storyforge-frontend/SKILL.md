---
name: storyforge-frontend
description: "Broader StoryForge frontend standards: feature-driven architecture, shadcn/ui + Tailwind patterns, fetch + auth flow, accessibility, Vitest + RTL testing setup, file naming, pre-submit checklist. Activate on any frontend task — component/page/hook authoring, styling work, test writing, form work, refactors under frontend/. Pairs additively with react-patterns (React code mechanics) and typescript-patterns (TS rules)."
---

# StoryForge — Frontend Standards

The wider rules for working under `frontend/`. Narrower companion skills handle:

- **`react-patterns`** — React component / hook code mechanics (declaration style, discriminated-union state, refs, memoization).
- **`typescript-patterns`** — cross-cutting TS rules (`unknown`/`any`, narrowing, utility types, `as const`).

Canonical baseline that Copilot and other tools also follow: [frontend/AGENTS.md](../../../frontend/AGENTS.md). This skill expands with examples and a pre-submit checklist.

---

## Feature-driven architecture

Tree:

```
src/
├── app/                  # router + providers
├── features/<name>/      # business capabilities
│   ├── api/
│   ├── components/
│   ├── hooks/
│   ├── routes/           # page-level components
│   ├── types/
│   ├── utils/
│   └── index.ts          # public API barrel
├── components/
│   ├── ui/               # shadcn primitives (global)
│   └── layout/           # cross-feature layout
└── lib/utils.ts          # cn()
```

Rules:

- Business logic lives in `features/<name>/`.
- Cross-feature consumers import from `@/features/<name>` (barrel only).
- Deep imports (`@/features/auth/components/LoginForm`) are forbidden.
- Features cannot import from each other except via barrels.

If you're tempted to add a component to `components/` outside `ui/` or `layout/`, it almost certainly belongs in a feature.

---

## shadcn primitives & Tailwind

**Primitive-first.** Before writing a raw `<input>`, `<button>`, `<textarea>`, `<form>`, or `<label>`, check `@/components/ui/`. If the primitive doesn't exist, add it:

```bash
npx shadcn-ui@latest add <name>
```

**Never modify primitive source** for one-off styling. Customize at the call site:

```tsx
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

<Button className={cn('w-full', isSpecial && 'shadow-xl')}>
  Save
</Button>
```

The `cn()` helper combines `clsx` + `tailwind-merge` — last class wins on conflicts, so call-site overrides land cleanly.

**Brand & semantic colors.** Use shadcn tokens (`primary`, `destructive`, `muted-foreground`, `accent`) and the `brand-gradient` Tailwind token. Don't hardcode `text-purple-600`, `from-pink-500 to-purple-600`, `text-indigo-*`, etc. — they bypass theming and fight dark mode.

---

## API calls — fetch + auth + error mapping

The repo uses native `fetch` (no `axios`). Auth-aware requests pull the token from `features/auth`:

```ts
import { getAuthToken } from '@/features/auth';

async function postGenerateScript(body: { story: string; style: StoryStyle }) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/generate/script`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}
```

Errors map to user-readable Spanish messages **inside the hook**, never inside the component:

```ts
const ERROR_MAP: Record<number, string> = {
  400: 'Revisá el texto o el estilo seleccionado.',
  401: 'Your session expired. Sign in again.',
  429: 'Limit reached. Try again in a minute.',
};

const NETWORK_ERROR = 'Connection error. Check your internet.';
```

User-facing strings are English. Code, comments, rules, commits: English.

`API_BASE` always comes from `import.meta.env.VITE_API_URL` with a localhost fallback. Never hardcode URLs at call sites.

---

## Accessibility minimums

- Inputs without a visible label: `aria-label="…"` on the element.
- Inputs with a visible label: link them with `htmlFor`/`id` and use `useId()` for the id.
- Interactive non-`<button>` elements (radio-card buttons, custom toggles): `role="radio"` (or appropriate), `aria-checked`, `tabIndex={0}`, keyboard handler for `Enter`/`Space`.
- Live regions for dynamic counters or status text: `aria-live="polite"`.
- Focus visible on every interactive element (shadcn primitives do this; verify after customizing).

WCAG AA + full keyboard navigation is the bar.

---

## File naming

| Kind | Pattern | Example |
|---|---|---|
| Component | `PascalCase.tsx` | `StoryInput.tsx` |
| Custom hook | `useCamelCase.ts` | `useGenerateScript.ts` |
| Hook return type | `UseXReturn` (exported) | `UseGenerateScriptReturn` |
| Types module | `index.ts` inside `types/` | `features/generation/types/index.ts` |
| Test | `<file>.test.ts(x)` next to source | `StoryInput.test.tsx` |
| Util | `camelCase.ts` | `deriveStages.ts` |
| Barrel | `index.ts` (only at feature root) | `features/auth/index.ts` |

One component or hook per file. Multiple small types per file is fine — that's what `types/index.ts` is for.

---

## Testing

- **Vitest + `@testing-library/react`** + `jsdom`.
- **Co-locate** the test next to the source (no `__tests__/` folder).
- **One test file per public surface** (`Component.test.tsx` or `useHook.test.ts`).
- **Test behavior, not implementation.** Render, simulate user input via `userEvent`, assert on rendered output and accessibility roles. Don't assert internal state shape.
- **Mock at the network boundary** — `fetch` or the service function — not inside the component or hook.

```ts
// ✅ Behavior
it('shows the script after generation completes', async () => {
  vi.spyOn(generateApi, 'postGenerateScript').mockResolvedValue({
    jobId: 'job_1', status: 'pending', createdAt: '…',
  });
  render(<Generate />);
  await userEvent.click(screen.getByRole('button', { name: /generate/i }));
  expect(await screen.findByText(/generating/i)).toBeInTheDocument();
});

// ❌ Implementation detail
it('calls setState with submitting', () => { … });
```

Cover the happy path **and** at least one edge case (validation failure, error response, empty result).

---

## Pre-submit checklist

Before you call a frontend change done:

- [ ] `npm run build` passes (`tsc -b` + Vite build).
- [ ] `npm run lint` passes.
- [ ] `npm test` passes (and the new tests are meaningful, not trivial).
- [ ] New components live under the right feature folder, not in `pages/` / `components/` / `hooks/` / `services/`.
- [ ] Cross-feature imports go through `@/features/<name>` barrels — no deep paths.
- [ ] No raw `<input>` / `<button>` / `<textarea>` / `<form>` / `<label>` where a `@/components/ui` primitive exists.
- [ ] No `alert()` — use `toast` (sonner) or an inline `<Alert>`.
- [ ] No hardcoded brand colors — use the `brand-gradient` token or semantic tokens.
- [ ] No `any` (see `typescript-patterns`).
- [ ] Hooks return discriminated unions, not parallel `isLoading`/`error` booleans (see `react-patterns`).
- [ ] User-facing strings are English; code identifiers, comments, and commits are English.
- [ ] Accessibility: `aria-label` / `htmlFor` / keyboard handlers where needed.

---

## Never do

- ❌ Recreate the old technical-layer folders (`src/pages/`, `src/hooks/`, `src/services/`, `src/contexts/`, `src/types/`, `src/utils/`) or drop loose files into `src/components/` outside `ui/` or `layout/`. New code lands under `features/<name>/`.
- ❌ Modify shadcn primitive sources in `@/components/ui/` for a single-use customization. Customize at the call site via `className` + `cn()`.
- ❌ Import from another feature's internal paths (`@/features/auth/api/…`). Use the barrel.
- ❌ Hardcoded API URLs in a service. Use `import.meta.env.VITE_API_URL`.
- ❌ Direct `localStorage` / `sessionStorage` access outside an auth or handoff hook. Wrap storage in a typed module.
- ❌ Inline styles (`style={{ color: 'red' }}`). Tailwind classes only.
- ❌ `console.log(user)` or any object that may contain a token / PII. Log specific fields, never whole objects.
- ❌ Adding `axios`, `zustand`, or `react-query` casually. They're installed but unused — adopting one needs a deliberate decision, not a one-off PR.
