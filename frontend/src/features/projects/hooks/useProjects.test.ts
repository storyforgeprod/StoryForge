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
      expect(result.current.state.message).toBe('Connection error. Check your internet.');
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
