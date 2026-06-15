---
name: typescript-patterns
description: "Cross-cutting TypeScript code patterns for StoryForge (frontend + backend). Activate whenever the user writes or edits any .ts or .tsx file — even when TypeScript is not explicitly named (phrases like 'type this response', 'fix the any', 'add the DTO', 'extract the type', 'narrow this'). Enforces: unknown over any, discriminated unions, type vs interface choice, generics with constraints, utility types (Pick/Omit/Partial/Record/ReturnType/Awaited), as const over enum, custom type guards, type-only imports, exhaustive switches. Pairs additively with react-patterns (React/JSX-specific TS) and storyforge-backend (NestJS DTOs)."
---

# TypeScript Patterns — StoryForge

Cross-cutting TypeScript rules for the whole repo. React-specific TS patterns (props, hook return shapes) live in `react-patterns`. NestJS-specific patterns (DTOs with `class-validator`, decorators) live in `storyforge-backend`. This skill covers the language itself.

Both `frontend/tsconfig.app.json` and `backend/tsconfig.json` have `strict: true` — every rule below assumes that's on and stays on.

---

## `unknown` over `any`

`any` opts out of the type system entirely. `unknown` holds any value but forces you to narrow before using it. Reach for `unknown` when you genuinely don't know the shape (third-party APIs, error objects, JSON parses); reach for the concrete type otherwise.

```ts
// ❌ Disables checking; downstream code can do anything to err
function handle(err: any) {
  return err.response.data.message;
}

// ✅ Forces a narrow before use
function handle(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
    return err.message;
  }
  return 'Unknown error';
}
```

With `useUnknownInCatchVariables` (on by default in strict), `catch` variables are already `unknown`:

```ts
try {
  await postGenerateScript(input);
} catch (err) {
  // err is unknown — narrow it
  if (err instanceof Error) logger.error(err.message);
}
```

---

## `type` vs `interface`

Both can describe an object shape; pick by intent:

- **`type`** for unions, intersections, primitives, mapped/conditional types, function signatures, and tuples. Anything that isn't a plain object shape.
- **`interface`** for extensible object shapes, especially when consumers or libraries might add to them via declaration merging (rare in app code, common in libraries).

For app code in this repo, default to `type`. Stay consistent within a module — don't mix the two for similar concepts in the same file.

```ts
// ✅ Union: type
type StoryStyle = 'anime' | 'manga' | 'webtoon' | 'novel';

// ✅ Object shape: type
type User = {
  id: string;
  email: string;
  name?: string;
  role: 'USER' | 'DEVELOPER';
};

// ✅ Function signature: type
type MapApiError = (err: unknown) => string;
```

---

## Discriminated unions

The single most useful pattern for modeling "this value is in one of several shapes." Each variant has a literal discriminant property; TypeScript narrows the shape automatically based on it. Lets you make impossible states unrepresentable.

```ts
type JobResult =
  | { status: 'pending'; jobId: string }
  | { status: 'processing'; jobId: string; progress: number }
  | { status: 'completed'; jobId: string; resultUrl: string }
  | { status: 'failed'; jobId: string; error: string };

function format(job: JobResult): string {
  switch (job.status) {
    case 'pending':    return `Job ${job.jobId} queued`;
    case 'processing': return `Job ${job.jobId} ${job.progress}%`;
    case 'completed':  return `Done: ${job.resultUrl}`;
    case 'failed':     return `Failed: ${job.error}`;
  }
}
```

**Exhaustiveness check** — add a `never`-typed default so adding a new variant fails to compile until every consumer handles it:

```ts
function format(job: JobResult): string {
  switch (job.status) {
    case 'pending':    return `…`;
    case 'processing': return `…`;
    case 'completed':  return `…`;
    case 'failed':     return `…`;
    default: {
      const _exhaustive: never = job;
      return _exhaustive;
    }
  }
}
```

Without that default, adding a new variant later silently slips through every switch.

---

## Generics with constraints

Generics make a function/type reusable across input shapes. Reach for them only when there's a meaningful relationship between two type parameters — overusing generics makes code unreadable. Constrain with `extends` so the body can rely on shared properties.

```ts
// ✅ The return type follows the input; constraint guarantees `id` exists
function findById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find((item) => item.id === id);
}

// ❌ Pointless: no relationship between input and output, just `any` in disguise
function process<T>(input: T): unknown {
  return JSON.parse(JSON.stringify(input));
}
```

When the generic is only used in one place, consider if a concrete type would be clearer. When two generics need to vary together, name them descriptively (`TIn`, `TOut`) rather than `T`, `U`.

---

## Utility types

The built-in transforms cover most "I need a variant of this type" cases. Use them instead of hand-rolling parallel types that drift.

```ts
type User = { id: string; email: string; name: string; role: 'USER' | 'DEVELOPER' };

// Update payload — only some fields, all optional
type UserUpdate = Partial<Pick<User, 'name' | 'email'>>;

// Public view — strip sensitive fields
type PublicUser = Omit<User, 'role'>;

// Lookup table — keys are role values, values are display labels
type RoleLabels = Record<User['role'], string>;
const labels: RoleLabels = { USER: 'User', DEVELOPER: 'Developer' };

// Derived from a function — stays in sync when the function changes
async function fetchUser(id: string) {
  return { id, email: '…', name: '…', role: 'USER' as const };
}
type FetchedUser = Awaited<ReturnType<typeof fetchUser>>;
```

Daily-use list: `Partial`, `Required`, `Readonly`, `Pick`, `Omit`, `Record`, `ReturnType`, `Awaited`, `NonNullable`, `Parameters`. Prefer composing these over writing mapped types by hand.

---

## `as const` and avoiding `enum`

`enum` has well-known footguns (numeric enums leak reverse mappings, const enums conflict with `isolatedModules`, runtime cost). Use a frozen `as const` object plus a derived type union — same ergonomics, simpler runtime, identical narrowing. This is the codebase's own pattern:

```ts
// frontend/src/types/generate.ts
export const StoryStyle = {
  ANIME:   'anime',
  MANGA:   'manga',
  WEBTOON: 'webtoon',
  NOVEL:   'novel',
} as const;

export type StoryStyle = typeof StoryStyle[keyof typeof StoryStyle];
//          ^^^^^^^^^^ = 'anime' | 'manga' | 'webtoon' | 'novel'
```

For pure type unions where you don't need a runtime object, just write the literal union:

```ts
type Status = 'idle' | 'submitting' | 'completed' | 'error';
```

`as const` also locks tuple types and freezes readonly arrays:

```ts
const ROLES = ['USER', 'DEVELOPER'] as const;  // readonly ['USER', 'DEVELOPER']
type Role = typeof ROLES[number];              // 'USER' | 'DEVELOPER'
```

---

## Type narrowing and type guards

Built-in narrowers — use these before reaching for custom guards:

- `typeof x === 'string'` for primitives.
- `x instanceof Class` for class instances.
- `'prop' in obj` for property presence on a union of object types.
- Discriminant check (`x.kind === 'foo'`) for discriminated unions.

When the narrowing logic is reused, extract a **custom type guard** — a predicate returning `value is T`:

```ts
type ApiError = { status: number; message: string };

function isApiError(err: unknown): err is ApiError {
  return (
    typeof err === 'object' && err !== null &&
    'status' in err && typeof (err as { status: unknown }).status === 'number'
  );
}

function mapApiError(err: unknown): string {
  if (isApiError(err)) return ERROR_MAP[err.status] ?? 'Network error';
  return 'Network error';
}
```

`as` casts (`value as ApiError`) **bypass** the type system — they're a promise to TypeScript that you're right, not a check. Reach for them only at FFI boundaries (parsing trusted JSON, narrowing after a guard you can't restructure). Every other `as` is a code smell.

`!` (non-null assertion) is the same hazard in miniature. If `value!` is correct, a type guard (`if (value)`) usually makes the same code safer.

---

## Type-only imports

Mark type-only imports with `import type` (or per-specifier `import { type X, ... }`). Three reasons: signals intent, lets bundlers tree-shake the module, and avoids accidental runtime cycles when only types are needed.

```ts
// ✅ Pure type — won't emit a runtime import
import type { User, AuthContextType } from '@/features/auth';

// ✅ Mixed: value + type from the same module
import { loginUser, type AuthResponse } from '@/features/auth';

// ❌ Imports the runtime module just for a type
import { User } from '@/features/auth';
```

With `verbatimModuleSyntax` (recommended in tsconfig), TypeScript enforces this automatically and warns on the third form.

---

## Return type annotations

- **Annotate explicitly** for public APIs — exported functions, hook return types, service methods, anything consumed across module boundaries. The annotation locks the contract; if the body changes the shape by accident, the error happens at the function, not at every caller.
- **Let TypeScript infer** for locals, callbacks, and one-off helpers. Inference is usually right and stays terse.

```ts
// ✅ Exported — annotate
export function mapApiError(err: unknown): string { ... }

// ✅ Local — infer
const counts = items.map((item) => item.score);
```

Async functions: annotate the resolved type, not the wrapping `Promise`:

```ts
// ✅ Reads like "this returns a User"
async function fetchUser(id: string): Promise<User> { ... }
```

---

## Never do

- ❌ `any` — use `unknown` and narrow, or a concrete type.
- ❌ `enum` — use `as const` object + `typeof[keyof typeof]` derived union.
- ❌ `as` casts to bypass an error you didn't read. Read it first.
- ❌ `!` non-null assertion when a guard would do.
- ❌ `// @ts-ignore` / `// @ts-expect-error` without a comment explaining why and a date or ticket to revisit.
- ❌ Duplicate type definitions across files. One source of truth per type; consumers import.
- ❌ Re-deriving an existing type by hand when `Pick`/`Omit`/`ReturnType` would do it.
- ❌ Numeric enums and `const enum` (the latter breaks under `isolatedModules`).
- ❌ Function overloads when a discriminated union or generic does the same job more clearly.
- ❌ `Object`, `Function`, `{}` as types — they mean "any non-nullish value" and rarely model the actual intent. Use `unknown`, `object`, or a specific shape.
