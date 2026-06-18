# Design: Home Page — Real Project Stats & Recent Projects

**Date:** 2026-06-18
**Scope:** `frontend/src/features/home/routes/HomePage.tsx` only

## Problem

`HomePage` displays hardcoded data: a `STATS` array with fake counts ("4 Projects", "3 Renders left", "1 Exported") and a `RECENT_PROJECTS` array with three fake projects. Users see stale placeholder data instead of their real content.

## Goal

Replace all hardcoded data in `HomePage` with real data fetched from the backend using the existing `useProjects` hook. No backend changes. No new files.

## Approach

Call `useProjects()` in `HomePage` and derive everything from its result:

- `totalProjects` = `projects.length`
- `exportedCount` = `projects.filter(p => p.status === 'completed').length`
- `recentProjects` = `projects.slice(0, 3)`

## Stat Cards

Reduced from 3 to 2 cards. "Renders left" is removed (no quota endpoint exists yet).

| Label | Value |
|---|---|
| Projects | `totalProjects` |
| Exported | `exportedCount` |

## UI States

### Loading (`phase: 'loading'`)
- Stat values render as `—`
- Recent section renders a centered spinner (same pattern as `ProjectsPage`)

### Error (`phase: 'error'`)
- Stat values render as `—`
- Recent section renders the error message and a Retry button that calls `refresh()`

### Success, 0 projects (`phase: 'success'`, `projects.length === 0`)
- Stat values render as `0`
- Recent section renders an empty state: "No projects yet" + "Create your first story" button that navigates to `/app`

### Success, N projects (`phase: 'success'`, `projects.length > 0`)
- Stat values render real counts
- Recent section renders up to 3 `ProjectCard` components with real data
- Cards are not expandable in this context (`isExpanded={false}`, `onToggle={() => {}}`)

## No Timeout

The fetch has no explicit timeout. If the network fails, the native fetch eventually throws and transitions to the error state. Acceptable for MVP where the backend is controlled.

## Files Changed

| File | Change |
|---|---|
| `frontend/src/features/home/routes/HomePage.tsx` | Remove `STATS` and `RECENT_PROJECTS` constants; add `useProjects()` call; render real stats and recent projects across all 4 UI states |

## Files Not Changed

- `frontend/src/features/projects/hooks/useProjects.ts`
- `frontend/src/features/projects/api/projectsApi.ts`
- `frontend/src/features/projects/components/ProjectCard.tsx`
- Backend — no changes
