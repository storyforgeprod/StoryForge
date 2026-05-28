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

Migration from the current technical-layer structure is phased in [docs/frontend-migration-plan.md](../docs/frontend-migration-plan.md). The rules below apply to all **new** code; pre-existing violations are tracked by the plan.

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

## Skills

- `storyforge-frontend` — activates on any `.tsx` or frontend task.
