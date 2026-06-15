# Projects Listing & Video Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the frontend `/projects` page to the real backend API so users can see all their generated projects and play/download their videos inline.

**Architecture:** Five frontend files are touched — types, API, hook, card component, and page. The backend (`GET /projects`) is already complete and requires no changes. The hook polls every 10 s while any project is `processing` and stops automatically.

**Tech Stack:** React 18, TypeScript strict, Vitest + Testing Library, `fetch` (no axios), lucide-react, shadcn/ui Button

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `frontend/src/features/projects/types/index.ts` | Replace placeholder types with backend DTO-aligned types |
| Create | `frontend/src/features/projects/api/projectsApi.ts` | Authenticated `GET /projects` fetch |
| Create | `frontend/src/features/projects/api/projectsApi.test.ts` | API unit tests |
| Create | `frontend/src/features/projects/hooks/useProjects.ts` | State machine hook with auto-poll |
| Create | `frontend/src/features/projects/hooks/useProjects.test.ts` | Hook unit tests |
| Modify | `frontend/src/features/projects/components/ProjectCard.tsx` | Add isExpanded + inline video panel |
| Create | `frontend/src/features/projects/components/ProjectCard.test.tsx` | Component unit tests |
| Modify | `frontend/src/features/projects/routes/ProjectsPage.tsx` | Wire hook, expandedId, all states |
| Modify | `frontend/src/features/projects/index.ts` | Update barrel exports |

---

## Task 1: Update Types

**Files:**
- Modify: `frontend/src/features/projects/types/index.ts`

- [ ] **Step 1.1: Replace the file contents**

```ts
// frontend/src/features/projects/types/index.ts
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
  duration: number;
  status: ProjectStatus;
  createdAt: string;
  output: ProjectOutput | null;
};
```

- [ ] **Step 1.2: Commit**

```bash
git add frontend/src/features/projects/types/index.ts
git commit -m "feat(projects): align Project type with backend DTO"
```

---

## Task 2: Projects API

**Files:**
- Create: `frontend/src/features/projects/api/projectsApi.ts`
- Create: `frontend/src/features/projects/api/projectsApi.test.ts`

- [ ] **Step 2.1: Write the failing tests**

```ts
// frontend/src/features/projects/api/projectsApi.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { getProjects } from './projectsApi';

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

function makeFetchMock(ok: boolean, status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body),
  });
}

describe('getProjects', () => {
  it('sends GET to /projects with Authorization header when token exists', async () => {
    localStorage.setItem('storyforge_token', 'test-token');
    const mockFetch = makeFetchMock(true, 200, []);
    vi.stubGlobal('fetch', mockFetch);

    await getProjects();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    );
  });

  it('returns array of projects on success', async () => {
    const projects = [
      {
        id: '1',
        title: 'Test',
        style: 'anime',
        duration: 60,
        status: 'completed',
        createdAt: '2026-01-01',
        output: null,
      },
    ];
    vi.stubGlobal('fetch', makeFetchMock(true, 200, projects));

    const result = await getProjects();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('throws typed error on 401', async () => {
    vi.stubGlobal('fetch', makeFetchMock(false, 401, { message: 'Unauthorized' }));

    await expect(getProjects()).rejects.toMatchObject({ status: 401 });
  });

  it('throws typed error on 500', async () => {
    vi.stubGlobal('fetch', makeFetchMock(false, 500, { message: 'Server error' }));

    await expect(getProjects()).rejects.toMatchObject({ status: 500 });
  });
});
```

- [ ] **Step 2.2: Run tests to confirm they fail**

```bash
cd frontend && npx vitest run src/features/projects/api/projectsApi.test.ts
```

Expected: `FAIL` — module not found.

- [ ] **Step 2.3: Implement `projectsApi.ts`**

```ts
// frontend/src/features/projects/api/projectsApi.ts
import { getAuthToken } from '@/features/auth';
import type { Project } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

type ApiError = { status: number; message: string };

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) return res.json() as Promise<T>;
  let message = 'Error de conexión. Revisá tu internet.';
  try {
    const body = await res.json();
    if (typeof body.message === 'string') message = body.message;
  } catch {
    // ignore parse error
  }
  const err: ApiError = { status: res.status, message };
  throw err;
}

export async function getProjects(): Promise<Project[]> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/projects`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return handleResponse<Project[]>(res);
}
```

- [ ] **Step 2.4: Run tests to confirm they pass**

```bash
cd frontend && npx vitest run src/features/projects/api/projectsApi.test.ts
```

Expected: all 4 tests `PASS`.

- [ ] **Step 2.5: Commit**

```bash
git add frontend/src/features/projects/api/projectsApi.ts \
        frontend/src/features/projects/api/projectsApi.test.ts
git commit -m "feat(projects): add projectsApi with GET /projects"
```

---

## Task 3: useProjects Hook

**Files:**
- Create: `frontend/src/features/projects/hooks/useProjects.ts`
- Create: `frontend/src/features/projects/hooks/useProjects.test.ts`

- [ ] **Step 3.1: Write the failing tests**

```ts
// frontend/src/features/projects/hooks/useProjects.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProjects } from './useProjects';
import * as projectsApi from '../api/projectsApi';
import type { Project } from '../types';

vi.mock('../api/projectsApi');

const mockGetProjects = vi.mocked(projectsApi.getProjects);

const makeProject = (overrides: Partial<Project> = {}): Project => ({
  id: '1',
  title: 'Test',
  style: 'anime',
  duration: 60,
  status: 'completed',
  createdAt: '2026-01-01',
  output: null,
  ...overrides,
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useProjects', () => {
  it('starts in loading phase', () => {
    mockGetProjects.mockResolvedValue([]);
    const { result } = renderHook(() => useProjects());
    expect(result.current.state.phase).toBe('loading');
  });

  it('transitions to success with projects on fetch', async () => {
    const projects = [makeProject()];
    mockGetProjects.mockResolvedValue(projects);

    const { result } = renderHook(() => useProjects());

    await act(async () => { await Promise.resolve(); });

    expect(result.current.state.phase).toBe('success');
    if (result.current.state.phase === 'success') {
      expect(result.current.state.projects).toHaveLength(1);
    }
  });

  it('transitions to error with message on fetch failure', async () => {
    mockGetProjects.mockRejectedValue({ message: 'Unauthorized' });

    const { result } = renderHook(() => useProjects());

    await act(async () => { await Promise.resolve(); });

    expect(result.current.state.phase).toBe('error');
    if (result.current.state.phase === 'error') {
      expect(result.current.state.message).toBe('Unauthorized');
    }
  });

  it('uses fallback message when error has no message field', async () => {
    mockGetProjects.mockRejectedValue(new Error('Network failure'));

    const { result } = renderHook(() => useProjects());

    await act(async () => { await Promise.resolve(); });

    expect(result.current.state.phase).toBe('error');
    if (result.current.state.phase === 'error') {
      expect(result.current.state.message).toBe('Error de conexión. Revisá tu internet.');
    }
  });

  it('polls every 10s when a project is processing', async () => {
    const processing = [makeProject({ status: 'processing' })];
    const completed = [makeProject({ status: 'completed' })];
    mockGetProjects
      .mockResolvedValueOnce(processing)
      .mockResolvedValueOnce(completed);

    const { result } = renderHook(() => useProjects());

    await act(async () => { await Promise.resolve(); });

    expect(result.current.state.phase).toBe('success');
    expect(mockGetProjects).toHaveBeenCalledTimes(1);

    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });

    expect(mockGetProjects).toHaveBeenCalledTimes(2);
    if (result.current.state.phase === 'success') {
      expect(result.current.state.projects[0].status).toBe('completed');
    }
  });

  it('does not poll when all projects are completed', async () => {
    mockGetProjects.mockResolvedValue([makeProject({ status: 'completed' })]);

    renderHook(() => useProjects());

    await act(async () => { await Promise.resolve(); });

    const callsBefore = mockGetProjects.mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });

    expect(mockGetProjects.mock.calls.length).toBe(callsBefore);
  });

  it('stops polling once no projects remain in processing', async () => {
    const processing = [makeProject({ id: '1', status: 'processing' })];
    const completed = [makeProject({ id: '1', status: 'completed' })];
    mockGetProjects
      .mockResolvedValueOnce(processing)
      .mockResolvedValueOnce(completed);

    renderHook(() => useProjects());

    await act(async () => { await Promise.resolve(); });
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });

    const callsAfterCompletion = mockGetProjects.mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });

    expect(mockGetProjects.mock.calls.length).toBe(callsAfterCompletion);
  });

  it('refresh() re-fetches and resets to loading', async () => {
    mockGetProjects.mockResolvedValue([]);
    const { result } = renderHook(() => useProjects());

    await act(async () => { await Promise.resolve(); });
    expect(result.current.state.phase).toBe('success');

    act(() => { result.current.refresh(); });
    expect(result.current.state.phase).toBe('loading');

    await act(async () => { await Promise.resolve(); });
    expect(result.current.state.phase).toBe('success');
    expect(mockGetProjects).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 3.2: Run tests to confirm they fail**

```bash
cd frontend && npx vitest run src/features/projects/hooks/useProjects.test.ts
```

Expected: `FAIL` — module not found.

- [ ] **Step 3.3: Implement `useProjects.ts`**

```ts
// frontend/src/features/projects/hooks/useProjects.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Project } from '../types';
import { getProjects } from '../api/projectsApi';

type State =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'success'; projects: Project[] };

export function useProjects(): { state: State; refresh: () => void } {
  const [state, setState] = useState<State>({ phase: 'loading' });
  const [fetchKey, setFetchKey] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPoll = useCallback(() => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const refresh = useCallback(() => {
    stopPoll();
    setState({ phase: 'loading' });
    setFetchKey((k) => k + 1);
  }, [stopPoll]);

  useEffect(() => {
    let cancelled = false;

    getProjects()
      .then((projects) => {
        if (cancelled) return;
        setState({ phase: 'success', projects });

        const hasProcessing = projects.some((p) => p.status === 'processing');
        if (hasProcessing && pollRef.current === null) {
          pollRef.current = setInterval(() => {
            setFetchKey((k) => k + 1);
          }, 10_000);
        } else if (!hasProcessing) {
          stopPoll();
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          typeof err === 'object' &&
          err !== null &&
          'message' in err &&
          typeof (err as { message: unknown }).message === 'string'
            ? (err as { message: string }).message
            : 'Error de conexión. Revisá tu internet.';
        setState({ phase: 'error', message });
        stopPoll();
      });

    return () => {
      cancelled = true;
    };
  }, [fetchKey, stopPoll]);

  useEffect(() => stopPoll, [stopPoll]);

  return { state, refresh };
}
```

- [ ] **Step 3.4: Run tests to confirm they pass**

```bash
cd frontend && npx vitest run src/features/projects/hooks/useProjects.test.ts
```

Expected: all 7 tests `PASS`.

- [ ] **Step 3.5: Commit**

```bash
git add frontend/src/features/projects/hooks/useProjects.ts \
        frontend/src/features/projects/hooks/useProjects.test.ts
git commit -m "feat(projects): add useProjects hook with auto-poll for processing projects"
```

---

## Task 4: Update ProjectCard

**Files:**
- Modify: `frontend/src/features/projects/components/ProjectCard.tsx`
- Create: `frontend/src/features/projects/components/ProjectCard.test.tsx`

- [ ] **Step 4.1: Write the failing tests**

```tsx
// frontend/src/features/projects/components/ProjectCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectCard } from './ProjectCard';
import type { Project } from '../types';

vi.mock('@/features/generation', () => ({
  StyleThumb: ({ style }: { style: string }) => <div data-testid="style-thumb">{style}</div>,
}));

const makeProject = (overrides: Partial<Project> = {}): Project => ({
  id: '1',
  title: 'My Story',
  style: 'anime',
  duration: 60,
  status: 'completed',
  createdAt: '2026-01-01',
  output: {
    videoUrl: 'https://example.com/video.mp4',
    audioUrl: null,
    images: [],
    script: null,
    duration: 55,
  },
  ...overrides,
});

describe('ProjectCard', () => {
  it('renders the project title and style', () => {
    render(
      <ProjectCard project={makeProject()} isExpanded={false} onToggle={vi.fn()} />,
    );
    expect(screen.getByText('My Story')).toBeInTheDocument();
    expect(screen.getByText('anime')).toBeInTheDocument();
  });

  it('shows "Completed" badge for completed projects', () => {
    render(
      <ProjectCard project={makeProject()} isExpanded={false} onToggle={vi.fn()} />,
    );
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('shows "Processing…" badge for processing projects', () => {
    render(
      <ProjectCard
        project={makeProject({ status: 'processing', output: null })}
        isExpanded={false}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText('Processing…')).toBeInTheDocument();
  });

  it('shows "Failed" badge for failed projects', () => {
    render(
      <ProjectCard
        project={makeProject({ status: 'failed', output: null })}
        isExpanded={false}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('calls onToggle when a completed card is clicked', async () => {
    const onToggle = vi.fn();
    render(
      <ProjectCard project={makeProject()} isExpanded={false} onToggle={onToggle} />,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('does not call onToggle when a non-completed card is clicked', async () => {
    const onToggle = vi.fn();
    render(
      <ProjectCard
        project={makeProject({ status: 'processing', output: null })}
        isExpanded={false}
        onToggle={onToggle}
      />,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('shows video player and download link when expanded', () => {
    render(
      <ProjectCard project={makeProject()} isExpanded={true} onToggle={vi.fn()} />,
    );
    expect(screen.getByRole('link', { name: /download/i })).toBeInTheDocument();
    const video = document.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video?.src).toContain('video.mp4');
  });

  it('hides video panel when not expanded', () => {
    render(
      <ProjectCard project={makeProject()} isExpanded={false} onToggle={vi.fn()} />,
    );
    expect(document.querySelector('video')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 4.2: Run tests to confirm they fail**

```bash
cd frontend && npx vitest run src/features/projects/components/ProjectCard.test.tsx
```

Expected: `FAIL` — some tests fail because the component doesn't yet have the new props or video panel.

- [ ] **Step 4.3: Replace `ProjectCard.tsx` with the updated implementation**

```tsx
// frontend/src/features/projects/components/ProjectCard.tsx
import { ChevronDown, ChevronUp, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StyleThumb } from '@/features/generation';
import { cn } from '@/lib/utils';
import type { Project, ProjectStatus } from '../types';

const STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: 'Draft',
  processing: 'Processing…',
  completed: 'Completed',
  failed: 'Failed',
};

const STATUS_CLASS: Record<ProjectStatus, string> = {
  draft: 'bg-elev text-mut2 border-border',
  processing: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  completed: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  failed: 'border-destructive/30 bg-destructive/10 text-destructive',
};

const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s.toString().padStart(2, '0')}s` : `${s}s`;
};

export type ProjectCardProps = {
  project: Project;
  isExpanded: boolean;
  onToggle: () => void;
};

export const ProjectCard = ({ project, isExpanded, onToggle }: ProjectCardProps) => {
  const canExpand = project.status === 'completed' && project.output !== null;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={canExpand ? onToggle : undefined}
        className={cn(
          'w-full text-left transition',
          canExpand && 'cursor-pointer hover:-translate-y-[3px] hover:border-bd2',
          !canExpand && 'cursor-default',
        )}
        aria-expanded={canExpand ? isExpanded : undefined}
      >
        <div className="relative aspect-[9/16] max-h-[180px] overflow-hidden">
          <StyleThumb style={project.style} className="h-full w-full object-cover" />
        </div>
        <div className="px-4 py-3.5">
          <p className="text-sm font-bold leading-tight">{project.title}</p>
          <p className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-mut2">
            {project.style}
          </p>
          <div className="mt-2.5 flex items-center justify-between">
            <span
              className={cn(
                'rounded-full border px-2 py-[3px] font-mono text-[10px] uppercase tracking-[0.06em]',
                STATUS_CLASS[project.status],
              )}
            >
              {STATUS_LABEL[project.status]}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11.5px] text-mut2">{formatDuration(project.duration)}</span>
              {canExpand && (
                isExpanded
                  ? <ChevronUp className="h-3.5 w-3.5 text-mut2" />
                  : <ChevronDown className="h-3.5 w-3.5 text-mut2" />
              )}
            </div>
          </div>
        </div>
      </button>

      {isExpanded && project.output && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <video
            controls
            src={project.output.videoUrl}
            className="w-full rounded-lg"
            style={{ maxHeight: '400px' }}
          />
          <a href={project.output.videoUrl} download className="mt-3 block">
            <Button variant="outline" size="sm" className="w-full gap-2">
              <Download className="h-3.5 w-3.5" />
              Download video
            </Button>
          </a>
          {project.output.duration !== null && (
            <p className="mt-2 text-center font-mono text-[10.5px] text-mut2">
              {formatDuration(project.output.duration)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 4.4: Run tests to confirm they pass**

```bash
cd frontend && npx vitest run src/features/projects/components/ProjectCard.test.tsx
```

Expected: all 8 tests `PASS`.

- [ ] **Step 4.5: Commit**

```bash
git add frontend/src/features/projects/components/ProjectCard.tsx \
        frontend/src/features/projects/components/ProjectCard.test.tsx
git commit -m "feat(projects): add inline video expand to ProjectCard"
```

---

## Task 5: Wire ProjectsPage and Update Barrel

**Files:**
- Modify: `frontend/src/features/projects/routes/ProjectsPage.tsx`
- Modify: `frontend/src/features/projects/index.ts`

- [ ] **Step 5.1: Replace `ProjectsPage.tsx`**

```tsx
// frontend/src/features/projects/routes/ProjectsPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/layout/AppShell';
import { ProjectCard } from '../components/ProjectCard';
import { useProjects } from '../hooks/useProjects';

export const ProjectsPage = () => {
  const { state, refresh } = useProjects();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <AppShell crumb="Projects">
      <div className="mx-auto max-w-[900px] px-6 pb-20 pt-11 sm:px-12">
        <header className="mb-7 flex items-end justify-between">
          <div>
            <h1 className="font-head text-[34px] font-extrabold tracking-tight">Projects</h1>
            <p className="mt-1.5 text-[13.5px] text-muted-foreground">
              Todos tus shorts en un solo lugar.
            </p>
          </div>
        </header>

        {state.phase === 'loading' && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        {state.phase === 'error' && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-6 py-10 text-center">
            <p className="mb-4 text-sm text-destructive">{state.message}</p>
            <Button variant="outline" size="sm" onClick={refresh}>
              Retry
            </Button>
          </div>
        )}

        {state.phase === 'success' && state.projects.length === 0 && (
          <div className="rounded-xl border border-dashed border-bd2 py-16 text-center">
            <p className="mb-4 text-sm text-muted-foreground">
              Todavía no tenés proyectos. ¡Creá uno!
            </p>
            <Button size="sm" onClick={() => navigate('/app')}>
              Create your first story
            </Button>
          </div>
        )}

        {state.phase === 'success' && state.projects.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {state.projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isExpanded={expandedId === project.id}
                onToggle={() => handleToggle(project.id)}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};
```

- [ ] **Step 5.2: Update the barrel `index.ts`**

```ts
// frontend/src/features/projects/index.ts
export { ProjectsPage } from './routes/ProjectsPage';
export { ProjectCard } from './components/ProjectCard';
export { useProjects } from './hooks/useProjects';
export { getProjects } from './api/projectsApi';
export type { Project, ProjectStatus, ProjectOutput } from './types';
```

- [ ] **Step 5.3: Run the full projects test suite**

```bash
cd frontend && npx vitest run src/features/projects/
```

Expected: all tests pass (API + hook + card).

- [ ] **Step 5.4: Run the full frontend test suite to check for regressions**

```bash
cd frontend && npx vitest run
```

Expected: no new failures.

- [ ] **Step 5.5: Commit**

```bash
git add frontend/src/features/projects/routes/ProjectsPage.tsx \
        frontend/src/features/projects/index.ts
git commit -m "feat(projects): wire ProjectsPage to real API with loading, error, and empty states"
```

---

## Done

All five tasks produce a working, tested projects page that:
- Fetches real projects from `GET /projects` on mount
- Auto-polls every 10 s while any project is processing
- Shows a spinner (loading), error with retry, or empty state with CTA
- Lets users expand completed project cards to play and download their video inline
