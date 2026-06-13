# Projects Listing & Video Access — Design Spec

**Date:** 2026-06-12  
**Branch:** feature/refactor-frontend  
**Status:** Approved

## Problem

`ProjectsPage` currently renders hardcoded placeholder data. The backend already exposes `GET /projects` and `GET /projects/:id` (auth-guarded, returns real Supabase data including video URLs). The frontend has no API layer for projects and the `Project` type does not match the backend DTO.

## Goal

Wire the frontend projects feature to the real backend API. Users can see all their generated projects and access (play, download) the video inline from the project card.

## Scope

Frontend only. Backend is complete and requires no changes.

## Architecture

### 1. Types — `features/projects/types/index.ts`

Replace existing types with:

```ts
export type ProjectStatus = 'draft' | 'processing' | 'completed' | 'failed';

export type ProjectOutput = {
  videoUrl: string;
  audioUrl: string | null;
  images: string[];
  script: string | null;
  duration: number | null;
};

export type Project = {
  id: string;
  title: string;
  style: string;
  duration: number;        // seconds
  status: ProjectStatus;
  createdAt: string;
  output: ProjectOutput | null;
};
```

`style` is `string` (not `StoryStyle`) because the backend stores free-form values.

### 2. API — `features/projects/api/projectsApi.ts`

Single function:

```ts
export async function getProjects(): Promise<Project[]>
```

- Authenticated `GET /projects` using `getToken()` from `@/features/auth`
- Throws on non-2xx (caller handles error state)
- Same pattern as `generateApi.ts`

### 3. Hook — `features/projects/hooks/useProjects.ts`

```ts
type State =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'success'; projects: Project[] };

export function useProjects(): { state: State; refresh: () => void }
```

Behavior:
- Fetches on mount (phase `'loading'` → `'success'` | `'error'`)
- After each successful fetch: if any project has `status === 'processing'`, schedules a 10 s poll via `setInterval`; cancels when no processing projects remain or on unmount
- `refresh()` re-triggers a fetch manually (resets to `'loading'`)
- Cleanup: clears interval on unmount to avoid memory leaks

### 4. `ProjectCard` — `features/projects/components/ProjectCard.tsx`

New props added:

```ts
type ProjectCardProps = {
  project: Project;
  isExpanded: boolean;
  onToggle: () => void;
};
```

Status badge mapping:

| Status | Color | Label |
|---|---|---|
| `draft` | gray | Draft |
| `processing` | amber | Processing… |
| `completed` | green | Completed |
| `failed` | red | Failed |

Inline expand panel (rendered only when `isExpanded && project.output`):
- Native `<video controls src={output.videoUrl} />` (no external player dependency)
- Download `<a href={output.videoUrl} download>` button
- Duration badge

Clicking a card with `status !== 'completed'` or `output === null` does not expand (no-op toggle).

### 5. `ProjectsPage` — `features/projects/routes/ProjectsPage.tsx`

- Removes `PROJECTS_PLACEHOLDER`
- Uses `useProjects()` hook
- Tracks `expandedId: string | null` via `useState` — passed to each card; only one card open at a time
- **Loading:** centered spinner
- **Error:** inline message + "Retry" button calling `refresh()`
- **Empty:** dashed border box, "No projects yet" text, "Create your first story" `<Button>` → `/app`
- **Success:** existing `grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3` with real data

### 6. Barrel — `features/projects/index.ts`

Export new types, hook, and API function alongside existing component exports.

## Data Flow

```
ProjectsPage mounts
  → useProjects() starts fetch (phase: 'loading')
  → GET /projects (with JWT)
  → phase: 'success', projects: Project[]
  → if any processing → poll every 10s
  → render grid

User clicks completed card
  → expandedId = card.id
  → ProjectCard renders inline video panel
  → User plays video or clicks download
```

## Error Handling

- Network/auth errors caught in hook → `phase: 'error'`
- `refresh()` available to retry
- No retry loop — user-triggered only

## Out of Scope

- Pagination (not needed for MVP)
- Skeleton loading cards (Option C, not chosen)
- Project deletion or renaming
- `/projects/:id` detail page
- Backend changes
