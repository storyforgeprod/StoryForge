# Frontend Migration Plan — Feature-Driven Architecture

Migration plan to refactor `frontend/` from a technical-layer organization (services/hooks/types/contexts/pages) into a strict Feature-Driven Architecture (Bulletproof React style) with shadcn/ui.

Source analysis: see [Architectural Gap Analysis](#context) at the bottom for the assessment that produced this plan.

---

## Execution Strategy

| Principle | Decision |
|---|---|
| **Branching** | One PR per phase off `feature/clean-proyect`. Each merges independently to keep blast radius small. |
| **Validation gate** | Every phase ends with: `npm install` → `tsc -b --noEmit` → `npm test` → `npm run build` → manual smoke (login, generate flow). No phase merges until all green. |
| **Rollback** | Each phase is a clean revertible commit. Avoid mixing file moves with logic changes within a phase — except Phase 4 (which is logic-by-design). |
| **Order** | Phases 0 → 7 sequential. Phase 2 (auth) goes before Phase 3 (generation) because Phase 2 fixes the only cross-feature leak; Phase 3 then has a clean target to import. |
| **Tooling** | Use `git mv` to preserve blame. Run a global find/replace per phase to update imports. |

---

## Target Architecture

```
src/
├── app/
│   ├── App.tsx                    # router only
│   ├── main.tsx
│   ├── providers/AppProviders.tsx
│   └── routes/router.tsx          # route table
├── features/
│   ├── auth/
│   │   ├── api/{authApi.ts, tokenStore.ts}
│   │   ├── components/{LoginForm,RegisterForm,ProtectedRoute}.tsx
│   │   ├── hooks/useAuth.ts
│   │   ├── providers/AuthProvider.tsx
│   │   ├── routes/{LoginPage,RegisterPage}.tsx
│   │   ├── types/index.ts
│   │   └── index.ts               # public API barrel
│   ├── generation/
│   │   ├── api/generateApi.ts
│   │   ├── components/
│   │   │   ├── StoryInput.tsx StyleSelector.tsx VoiceSelector.tsx
│   │   │   ├── AudioPlayer.tsx DownloadCard.tsx ImageGrid.tsx
│   │   │   ├── PipelineProgress.tsx
│   │   │   ├── stages/{ScriptStage,ImagesStage,AudioStage,VideoStage}.tsx
│   │   │   ├── GenerationWizard.tsx PresetDialogs.tsx
│   │   ├── hooks/{useGenerateScript,Images,Audio,Video,useDevPresetHandoff}.ts
│   │   ├── routes/{GeneratePage,DevModePage}.tsx
│   │   ├── types/index.ts         # single StoryStyle + PipelineStage
│   │   ├── utils/validation.ts
│   │   └── index.ts
│   └── home/
│       ├── routes/{LandingPage,HomePage,NotFoundPage}.tsx
│       └── index.ts
├── components/
│   ├── ui/                        # shadcn primitives only
│   └── layout/Header.tsx          # truly cross-feature layout
├── lib/utils.ts
└── styles/index.css
```

**Architectural rules enforced via ESLint `import/no-restricted-paths`:**

1. Outside a feature → only `import from '@/features/<name>'` (root barrel), never `@/features/<name>/components/...`.
2. Features cannot import from each other except via the root barrel.
3. `components/ui/*` may be imported from anywhere.
4. Features may import from `components/layout/`, `lib/`, `components/ui/` — not from `app/` or other `features/<other>/internal-path`.

---

## Phase 0 — Foundation

**Goal:** prepare the repo to host the new tree without changing any runtime behavior.
**Time:** ~30 min.

### Tasks

1. Add to `frontend/tsconfig.app.json` (and `tsconfig.json`): no change needed — `@/*` alias already covers `@/features/*`. Just verify.
2. Edit `frontend/vite.config.ts`: confirm path alias resolution works (the existing `@/` alias inherits automatically).
3. Install: `npm install -D eslint-plugin-import`.
4. Edit `frontend/eslint.config.js`: add `import` plugin and a `no-restricted-paths` rule **at `warn`** (raised to `error` in Phase 7):
   - Forbid imports from `@/features/*/(api|components|hooks|providers|routes|types|utils)/**` outside that same feature.
   - Allowlist: `@/features/<X>` (the barrel itself).
5. Add brand tokens to `frontend/tailwind.config.js`:
   - `theme.extend.colors.brand = { 50: '...', 600: '...' }`
   - `theme.extend.backgroundImage['brand-gradient'] = 'linear-gradient(to right, ...purple-600, ...pink-600)'`
6. Baseline gates: `npm run build` + `npm test`.

### Acceptance

- Build green, tests green, no behavior change, lint shows no new errors.

---

## Phase 1 — Scaffold `features/`

**Goal:** stand up the empty tree so subsequent phases just `git mv` into place.
**Time:** ~15 min.

### Tasks

1. Create directories:
   ```
   frontend/src/features/auth/{api,components,hooks,providers,routes,types}
   frontend/src/features/generation/{api,components,hooks,routes,types,utils}
   frontend/src/features/generation/components/stages
   frontend/src/features/home/{routes}
   frontend/src/components/layout
   frontend/src/app/{providers,routes}
   ```
2. Create empty `index.ts` in each feature root (`features/auth/index.ts`, `features/generation/index.ts`, `features/home/index.ts`).

### Acceptance

- New folders exist, tree compiles unchanged.

---

## Phase 2 — Migrate `auth` Feature & Fix Cross-Feature Leak

**Goal:** consolidate all auth concerns under `features/auth/`. Eliminate the `generateApi → AuthContext` leak by extracting `getAuthToken` into a non-React token store.
**Time:** ~2 h. **Risk:** medium — `getAuthToken` is read from outside React.

### Tasks

1. **Extract token store** (the keystone change):
   - Create `features/auth/api/tokenStore.ts` exporting `getAuthToken`, `setAuthToken`, `clearAuthToken`, `getStoredUser`, `setStoredUser`, `clearStoredUser`. Pure module, no React imports.
   - Update `AuthContext` to call the store instead of `localStorage` directly.
2. `git mv frontend/src/contexts/AuthContext.tsx frontend/src/features/auth/providers/AuthProvider.tsx`. Rename file and exported component to `AuthProvider` cleanly; keep `useAuth` hook in the same file (or split to `features/auth/hooks/useAuth.ts`).
3. `git mv frontend/src/services/authApi.ts frontend/src/features/auth/api/authApi.ts`.
4. `git mv frontend/src/types/auth.ts frontend/src/features/auth/types/index.ts`.
5. `git mv frontend/src/components/ProtectedRoute.tsx frontend/src/features/auth/components/ProtectedRoute.tsx`.
6. `git mv frontend/src/pages/Login.tsx frontend/src/features/auth/routes/LoginPage.tsx` (rename component to `LoginPage`).
7. `git mv frontend/src/pages/Register.tsx frontend/src/features/auth/routes/RegisterPage.tsx` (rename to `RegisterPage`).
8. Populate `features/auth/index.ts`:
   ```ts
   export { AuthProvider, useAuth } from './providers/AuthProvider';
   export { ProtectedRoute } from './components/ProtectedRoute';
   export { LoginPage } from './routes/LoginPage';
   export { RegisterPage } from './routes/RegisterPage';
   export { getAuthToken } from './api/tokenStore';
   export type { User, AuthContextType, AuthResponse } from './types';
   ```
9. Global rewrite of imports in `App.tsx`, `Home.tsx`, `Generate.tsx`, `DevMode.tsx`, `Header.tsx`, **`services/generateApi.ts`**:
   - `@/contexts/AuthContext` → `@/features/auth`
   - `@/services/authApi` → `@/features/auth` (only public exports)
   - `@/components/ProtectedRoute` → `@/features/auth`
   - `@/pages/Login` → `@/features/auth` (export `LoginPage`)
   - `@/pages/Register` → `@/features/auth`
   - `@/types/auth` → `@/features/auth`
10. Delete now-empty `contexts/`, `services/authApi.ts`, `components/ProtectedRoute.tsx`, `types/auth.ts`, `pages/Login.tsx`, `pages/Register.tsx`.

### Acceptance

- `grep -r "contexts/AuthContext"` returns zero hits.
- Login flow works end-to-end.
- `generateApi.ts` imports `getAuthToken` from `@/features/auth` (barrel-only).

---

## Phase 3 — Migrate `generation` Feature

**Goal:** move all generation assets into `features/generation/`; flatten component folders; consolidate duplicate types.
**Time:** ~3 h. **Risk:** medium — many files, mechanical but lots of imports.

### Tasks

1. **Flatten component folders.** For each (`AudioPlayer`, `DownloadCard`, `ImageGrid`, `PipelineProgress`, `StyleSelector`, `VoiceSelector`):
   - `git mv frontend/src/components/<Name>/<Name>.tsx frontend/src/features/generation/components/<Name>.tsx`
   - `git mv frontend/src/components/<Name>/<Name>.test.* frontend/src/features/generation/components/<Name>.test.*`
   - Delete the now-empty `<Name>/` folder.
2. `git mv frontend/src/components/Input/StoryInput.tsx frontend/src/features/generation/components/StoryInput.tsx`. Delete `components/Input/`.
3. Move hooks: `git mv frontend/src/hooks/useGenerate*.ts frontend/src/features/generation/hooks/` (4 files + 4 tests).
4. `git mv frontend/src/services/generateApi.ts frontend/src/features/generation/api/generateApi.ts`.
5. **Consolidate types.** Create `features/generation/types/index.ts` merging `types/generate.ts` + `types/pipeline.ts`:
   - Keep the const-object `StoryStyle` from `generate.ts` as the single source of truth.
   - Rename the object-shaped `PipelineStage` (currently in `PipelineProgress.tsx`) to `PipelineStageView` to disambiguate from the string-id `PipelineStage`.
   - Delete `frontend/src/types/generate.ts`, `frontend/src/types/pipeline.ts`.
6. Update `PipelineProgress.tsx` to import `PipelineStageView` from `../types`.
7. Update `Generate.tsx` (still in `pages/` until Phase 4) to import the renamed `PipelineStageView`.
8. `git mv frontend/src/utils/validation.ts frontend/src/features/generation/utils/validation.ts`. Delete `utils/`.
9. `git mv frontend/src/pages/Generate.tsx frontend/src/features/generation/routes/GeneratePage.tsx` (rename to `GeneratePage`).
10. `git mv frontend/src/pages/DevMode.tsx frontend/src/features/generation/routes/DevModePage.tsx` (rename to `DevModePage`).
11. Populate `features/generation/index.ts`:
    ```ts
    export { GeneratePage } from './routes/GeneratePage';
    export { DevModePage } from './routes/DevModePage';
    export type { StoryStyle, PipelineStage, VoiceOption } from './types';
    ```
    Components and hooks are intentionally **not** exported — they're internal.
12. Global import rewrite. Update `App.tsx` to import `GeneratePage`, `DevModePage` from `@/features/generation`.

### Acceptance

- `grep -r "components/StyleSelector"` returns zero hits.
- `grep -r "hooks/useGenerate"` returns zero hits.
- Generate flow works end-to-end.
- Type-check green: no `PipelineStage` ambiguity, single `StoryStyle`.

---

## Phase 4 — Decompose `GeneratePage.tsx` (855 → ~150 LOC)

**Goal:** break the god-component into a thin orchestrator plus stage components. This is the highest-value phase for AI-readability and the most logic-touching — do it as its own PR.
**Time:** ~4 h. **Risk:** high — refactor of working user-facing code.

### Tasks

1. **Extract pure logic:** create `features/generation/utils/deriveStages.ts` containing the 40-line `deriveStages()` function. Add a unit test.
2. **Extract dev-mode handoff:** create `features/generation/hooks/useDevPresetHandoff.ts`.
   - Define a typed `DevHandoffPayload` interface co-located with the hook.
   - Hook handles sessionStorage read on mount, applies state via setter callbacks, and clears the storage key.
   - Update `DevModePage.tsx` to write the same typed shape.
3. **Extract preset dialogs:** create `features/generation/components/PresetDialogs.tsx`. Owns its own dialog-open state via a prop-driven controlled API:
   - Props: `{ open: PresetDialogState; onClose: () => void; onScriptApplied(jobId): void; onImagesApplied(jobId): void; onAudioApplied(jobId): void }`.
   - The three preset-API calls (`postPreset('script' | 'images' | 'audio')`) move into this component.
4. **Extract stage components** (each a dumb display + retry button):
   - `features/generation/components/stages/ScriptStage.tsx` — receives `state`, `isPresetMode`, `isDeveloper`, callbacks.
   - `features/generation/components/stages/ImagesStage.tsx`.
   - `features/generation/components/stages/AudioStage.tsx`.
   - `features/generation/components/stages/VideoStage.tsx`.
   - Each owns its `ref` for auto-scroll (or accept it as a prop).
5. **Extract wizard:** `features/generation/components/GenerationWizard.tsx`. Owns step state (`story` | `style` | `voice`), receives `story`, `style`, `voiceId`, `submitAttempted`, `isDeveloper`, and `onSubmit` callbacks. Renders `StoryInput`, `StyleSelector`, `VoiceSelector`.
6. **Slim down `GeneratePage.tsx`:** the page now just:
   - Hosts the 4 `useGenerate*` hooks and the 3 job-id states.
   - Wires `useDevPresetHandoff`.
   - Renders `<Header />`, `<PipelineProgress stages={deriveStages(...)}/>`, then the active stage component, then `<PresetDialogs />`.
   - Target ≤ 200 LOC.
7. Add component tests for at least `ScriptStage` and `GenerationWizard` (happy path + error state).

### Acceptance

- `GeneratePage.tsx` < 200 LOC.
- Full pipeline works for both authenticated and dev-preset flows (manual smoke).
- Each new stage component has either an existing or new test covering loading + completed + error.
- No behavior regression — verify story → script → images → audio → video end-to-end.

### Rollback

If a stage breaks, the phase is a single PR; revert wholesale rather than patch.

---

## Phase 5 — Migrate `home` & Layout

**Goal:** finish the move out of `pages/`; relocate truly cross-cutting layout.
**Time:** ~45 min.

### Tasks

1. `git mv frontend/src/pages/Landing.tsx frontend/src/features/home/routes/LandingPage.tsx`.
2. `git mv frontend/src/pages/Home.tsx frontend/src/features/home/routes/HomePage.tsx`.
3. `git mv frontend/src/pages/NotFound.tsx frontend/src/features/home/routes/NotFoundPage.tsx`.
4. Populate `features/home/index.ts`:
   ```ts
   export { LandingPage } from './routes/LandingPage';
   export { HomePage } from './routes/HomePage';
   export { NotFoundPage } from './routes/NotFoundPage';
   ```
5. `git mv frontend/src/components/Header.tsx frontend/src/components/layout/Header.tsx`.
6. Move app composition: `git mv frontend/src/App.tsx frontend/src/app/App.tsx`. Update `main.tsx` import. Move `App.tsx`'s `AppRoutes` into `app/routes/router.tsx` (just route table). Create `app/providers/AppProviders.tsx` wrapping `BrowserRouter > AuthProvider > children`.
7. Update all imports in `App.tsx` to the new feature barrels.
8. **Delete dead code:**
   - `frontend/src/components/common/` (empty)
   - `frontend/src/types/index.ts` (empty)
   - `frontend/src/types/` (now empty)
   - `frontend/src/components/PipelineNavigation.tsx` (unused — verify with `grep PipelineNavigation` before delete)
   - `frontend/src/pages/` (now empty)
   - `frontend/src/hooks/` (now empty)
   - `frontend/src/services/` (now empty)
   - `frontend/src/contexts/` (already empty after Phase 2)
   - `frontend/src/utils/` (already empty after Phase 3)

### Acceptance

- `frontend/src/` contains only `app/`, `features/`, `components/{ui,layout}`, `lib/`, `styles/`, `main.tsx`.
- App boots and all routes render.

---

## Phase 6 — UI Kit Hardening

**Goal:** replace hand-rolled UI with shadcn primitives.
**Time:** ~3 h. **Risk:** low-medium — visual changes possible; review screenshots.

### Tasks

1. Install primitives:
   ```
   npx shadcn-ui@latest add alert form radio-group select sonner skeleton dropdown-menu
   ```
2. Add `<Toaster />` to `app/providers/AppProviders.tsx` (or `app/App.tsx`).
3. **`LoginPage` + `RegisterPage`:**
   - Add `react-hook-form`, `zod`, `@hookform/resolvers`.
   - Refactor forms to `Form` + `FormField` + `zodResolver`.
   - Replace inline error `<div className="bg-red-50…">` with `<Alert variant="destructive">`.
4. **`StyleSelector`:** replace `<button role="radio">` with `RadioGroup` + `RadioGroupItem` (custom-styled to keep the tile look — `cn()` the existing classes onto `RadioGroupItem`).
5. **`VoiceSelector`:** same. Keep the audio-preview button as a sibling button inside each radio item.
6. **`GeneratePage` + `DevModePage`:** replace all `alert()` calls with `toast.error()` / `toast.success()`.
7. **Preset dialogs:** replace raw `<input>` / `<textarea>` with shadcn `Input` / `Textarea`.
8. **DevModePage stage selector:** replace pill `<button>` group with a `Select` component.
9. **Brand tokens:** find/replace `bg-gradient-to-r from-purple-600 to-pink-600` → `bg-brand-gradient`. Replace `text-red-600` → `text-destructive`, `text-purple-600` → `text-primary` where semantic.
10. Replace generic `Loader2` blocks in `GeneratePage` stages with `Skeleton` where it makes visual sense, or keep `Loader2` as-is if movement reads better.
11. Visual diff: capture before/after screenshots for the 6 main views.

### Acceptance

- Zero `alert()` calls remain.
- Zero raw `<input>` / `<textarea>` / `<form>` in pages or feature components.
- All semantic colors come from shadcn tokens; brand gradient lives in tailwind config.

---

## Phase 7 — Lock the Architecture

**Goal:** convert temporary lint warnings to errors and document the rules.
**Time:** ~30 min.

### Tasks

1. In `eslint.config.js`: change `import/no-restricted-paths` from `warn` → `error`.
2. Run `npm run lint` — fix any straggling deep imports the warning had been tolerating.
3. Add `frontend/docs/ARCHITECTURE.md` (or update root `docs/architecture.md`) with a one-page ADR:
   - Feature-driven tree diagram.
   - "Features only export via their root `index.ts`" rule.
   - "Cross-feature imports forbidden — share via `components/ui`, `components/layout`, `lib`, or lift to `app/`" rule.
4. Update root `CLAUDE.md` "Key paths" section to reflect the new tree. Update the `storyforge-frontend` skill if it references old paths.
5. Add a brief section to `CLAUDE.md` describing the public-API rule so future AI sessions inherit the constraint.

### Acceptance

- `npm run lint` green with rules at `error`.
- `CLAUDE.md` accurately reflects the tree.

---

## Risk Register

| Risk | Likelihood | Mitigation |
|---|---|---|
| `git mv` followed by edits in same commit loses blame | High | Two commits per file move: one pure `git mv`, one with edits. |
| Vite alias resolves stale paths in dev cache | Medium | Restart dev server between phases; clear `node_modules/.vite`. |
| `Generate.tsx` decomposition breaks the auto-scroll refs | Medium | Pass refs from page → stage as props; smoke-test scroll behavior. |
| `getAuthToken` extraction breaks token persistence | Medium | Cover with a test before move; verify `localStorage` keys unchanged. |
| `react-hook-form` migration changes validation timing | Low | Keep existing `validateStory` logic; integrate via `zod` schema, not rewrite. |
| Duplicate `StoryStyle`/`PipelineStage` resolution silently widens types | Medium | Run `tsc --noEmit` after Phase 3 with `--strict` already on; treat any new `unknown`/`any` as a fail. |
| Brand color find/replace catches unintended classes | Low | Use exact full-class matches, not substring; review each diff. |
| Phase 4 ships a regression undetected | High | Manual smoke (script → images → audio → video) as merge gate; add a Playwright happy-path test if time permits. |

---

## Quick-Win Fast Track (Optional, ~30 min, ship before Phase 0)

Independent of the full migration, these four diffs lift AI-readiness 3 → 5 today without restructuring:

1. `rm -rf frontend/src/components/common/ frontend/src/components/PipelineNavigation.tsx frontend/src/types/index.ts`.
2. Consolidate `StoryStyle` — delete the duplicate in `types/pipeline.ts`, re-export from `types/generate.ts`.
3. Extract `getAuthToken` from `AuthContext.tsx` into `contexts/tokenStore.ts` (same folder for now); update the one consumer in `generateApi.ts`.
4. Replace the three `alert()` calls in `Generate.tsx` with `console.error` + an inline error banner (Phase 6 will upgrade to toast).

---

## Suggested PR Sequence

| PR | Phase | Approx LOC delta | Mergeable independently |
|---|---|---|---|
| 1 | 0 — Foundation | +50 | Yes |
| 2 | 1 — Scaffold | +12 | Yes |
| 3 | 2 — Auth migration | ~0 net (moves + renames) | Yes |
| 4 | 3 — Generation migration | ~0 net | Yes |
| 5 | 4 — Decompose Generate | +200 / –600 | Yes |
| 6 | 5 — Home & layout | –50 (dead code) | Yes |
| 7 | 6 — UI kit | +300 / –200 | Yes |
| 8 | 7 — Lock & document | +80 | Yes |

**Total estimate: ~14 h across 8 PRs.**

---

## Context

### Source Analysis Summary

The plan above derives from an architectural gap analysis of the frontend as of 2026-05-28.

**Current state:** technical-layer organization. Code split across `components/`, `contexts/`, `hooks/`, `pages/`, `services/`, `types/`, `utils/`. No `features/` folder, no `index.ts` barrels.

**Key violations identified:**

1. **No feature isolation** — code organized by file type, not business capability.
2. **No Public API surface** — zero `index.ts` barrels; every consumer deep-imports paths.
3. **Cross-feature leak (explicit)** — `services/generateApi.ts` imports `getAuthToken` from `@/contexts/AuthContext`. The Context module also exports a non-React utility.
4. **Cross-feature leak (implicit)** — `pages/DevMode.tsx` writes `sessionStorage`, `pages/Generate.tsx` reads it on mount with no typed contract.
5. **God-component** — `pages/Generate.tsx` is 855 lines, 14 state hooks, 3 modals, 4 generation flows, sessionStorage parsing, auto-scroll refs.
6. **Duplicated types** — `StoryStyle` defined twice (`types/generate.ts`, `types/pipeline.ts`); `PipelineStage` defined twice with *different shapes* (string union vs object).
7. **Folder/naming inconsistencies** — PascalCase folders mixed with lowercase; single-file folders mixed with flat siblings; mixed `export function` vs `export const`.
8. **Dead code** — empty `components/common/`, empty `types/index.ts`, unused `components/PipelineNavigation.tsx`.
9. **Business logic in pages** — `deriveStages()`, preset API calls, sessionStorage parsing all live in `Generate.tsx`.

### UI Kit Gaps

shadcn primitives present: `button`, `card`, `dialog`, `input`, `label`, `textarea`.

Missing primitives the code reinvents:

| Need | Current implementation |
|---|---|
| `RadioGroup` | `<button role="radio">` in `StyleSelector`, `VoiceSelector` |
| `Form` | Raw `<form>` + manual state in `Login`, `Register` |
| `Alert` | Raw `<div className="bg-red-50…">` error banners |
| `Toast` (sonner) | Three `alert()` calls in `Generate.tsx`, four in `DevMode.tsx` |
| `Select` | Pill-button toggle group in `DevMode.tsx` |
| `Skeleton` | Repeated `Loader2` spinner blocks |

Raw HTML elements bypassing primitives: `<textarea>`/`<input>` in `Generate.tsx` preset dialogs, raw `<label>` and `<button>` across `Login`, `Register`, `DevMode`, `Home`, `Header`.

Hard-coded brand colors (`from-purple-600 to-pink-600`, `text-indigo-*`, `text-red-*`) mixed with shadcn semantic tokens (`text-primary`, `text-destructive`). No design tokens for the brand gradient.

### AI-Readiness Score

**Current: 3 / 10.** To understand "image generation" end-to-end an AI agent must read ~10 files across 6 folders, none of which announces itself as belonging to a feature.

**Target: 9 / 10.** With per-feature barrels and lint-enforced public APIs, the agent reads 2-3 files per feature task. Estimated token cost per feature task drops ~70%.
