# Frontend — AGENTS.md

Frontend-specific guidance for the StoryForge React SPA. Cross-cutting rules live in the root [AGENTS.md](../AGENTS.md).

## Stack

- React 18, Vite 5, TypeScript (strict)
- TailwindCSS + shadcn/ui (style: new-york, baseColor: slate)
- React Router 6
- Vitest + Testing Library + jsdom
- `fetch` for HTTP (no axios), `useState` for local state (no zustand store yet)

## Run

    cd frontend
    npm install
    npm run dev      # :5173
    npm test
    npm run build
    npm run lint

## Environment

`frontend/.env.local` — `VITE_API_URL` (backend base; defaults to `http://localhost:3000`).

## Path Alias

`@/*` → `src/*` (configured in `tsconfig.app.json` and `vite.config.ts`).

## Architecture

Feature-driven (Bulletproof React). Target tree:

    src/
    ├── app/                  # composition root: providers, router
    ├── features/<name>/      # one folder per business capability
    │   ├── api/
    │   ├── components/
    │   ├── hooks/
    │   ├── routes/           # page-level components
    │   ├── types/
    │   ├── utils/
    │   └── index.ts          # public API barrel
    ├── components/
    │   ├── ui/               # shadcn primitives (global)
    │   └── layout/           # cross-feature layout (Header, etc.)
    ├── lib/utils.ts          # cn() helper
    └── styles/

## Rules

### Feature isolation
- Business logic lives inside `src/features/<name>/`.
- Cross-feature consumers import only from `@/features/<name>` (the barrel).
- Deep imports like `@/features/auth/components/LoginForm` are forbidden.
- Features cannot import from each other except via the barrel.

### UI primitives
- Use shadcn primitives in `@/components/ui` before any raw HTML element.
- Customize per-use via Tailwind classes + the `cn()` helper. Don't modify primitive sources for single-use cases.
- Missing primitives are added with `npx shadcn-ui@latest add <name>` — never hand-rolled.

### Forbidden in feature code
- Raw `<input>`, `<textarea>`, `<button>`, `<form>`, `<label>` — use the primitive.
- `alert()` — use `toast` (sonner). Install via shadcn when first needed.
- Hard-coded brand colors (`from-purple-600 to-pink-600`, `text-indigo-*`) — use semantic shadcn tokens (`primary`, `destructive`, `muted-foreground`) or the `brand-gradient` token.
- Duplicate type definitions across files — one source of truth per type.

### Components
- Co-locate: `Component.tsx` + `Component.test.tsx` in the same folder.
- Typed props via explicit `type` or `interface`. No `any`.
- Declare components as named arrow functions: `export const X = (props: Props) => …`. Use a block body only when there's logic before the return. (Hooks stay as `export function useX()` — the asymmetry helps the reader tell them apart at a glance.)

### Hooks
- Custom hooks own polling/async state and return discriminated-union state (`{ phase: 'idle' | 'submitting' | 'polling' | 'completed' | 'error', ... }`). Components stay dumb.
- Cleanup (`clearInterval`, abort controllers) in an effect cleanup function or on `reset()`.

### Tests
- Vitest + `@testing-library/react`. No snapshots for behavior-driven components.
- One file per public surface (`Component.test.tsx`, `useThing.test.ts`).

## Prototype

`frontend/prototipo/` is the visual source of truth for the UI. Read [frontend/prototipo/README.md](prototipo/README.md) for the full design system (color tokens, typography, border radii, Tailwind config, component reference, and screen map).

**When applying the prototype:**
- Adapt Tailwind classes, CSS variables, and visual structure only.
- Never touch state logic, API calls, event handlers, routing, auth, or tests.
- Token source: `prototipo/tokens/variables.css` → paste into `src/index.css`.
- Visual reference per screen: `prototipo/screens/*.png`.

## Theming (Editorial Bold)

The prototype is applied. Conventions:

- Tokens live in `src/index.css`: shadcn semantic vars (`--background`, `--primary`, …) hold **full color values** (hex / oklch), and `tailwind.config.js` reads them as `var(--x)` (no `hsl()` wrapper). Editorial-only extras: `elev`, `elev2`, `bd2`, `mut2`, `acc2`, `acc-soft`, `acc-bd`, `on-acc`.
- Fonts: `font-head` (Bricolage Grotesque), `font-body` (Plus Jakarta Sans), `font-mono` (JetBrains Mono). Animations: `animate-eq`, `animate-dot-bounce`, `animate-dot-pulse`.
- Dark is the default; `[data-theme="light"]` overrides. Toggle via `useTheme()` from `@/app/providers/ThemeProvider` (persists to localStorage).
- Authenticated pages render inside `<AppShell>` (`@/components/layout`, sidebar + crumb); auth pages use `<AuthLayout>`. `StyleThumb` (`@/features/generation`) renders per-style SVG art.

## Skills

- `storyforge-frontend` — activates on any `.tsx` or frontend task.
