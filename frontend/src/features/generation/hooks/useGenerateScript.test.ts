import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGenerateScript } from './useGenerateScript';
import * as generateApi from '../api/generateApi';

vi.mock('../api/generateApi');

const mockPost = vi.mocked(generateApi.postGenerateScript);
const mockPoll = vi.mocked(generateApi.getJobStatus);

beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('useGenerateScript', () => {
    it('starts in idle phase', () => {
        const { result } = renderHook(() => useGenerateScript());
        expect(result.current.state.phase).toBe('idle');
    });

    it('happy path: idle → submitting → polling → completed', async () => {
        mockPost.mockResolvedValue({
            jobId: 'job-1',
            status: 'pending',
            createdAt: '2026-01-01T00:00:00Z',
        });
        mockPoll.mockResolvedValue({
            jobId: 'job-1',
            status: 'completed',
            script: 'Generated script content',
        });

        const { result } = renderHook(() => useGenerateScript());

        act(() => {
            result.current.generate('My story');
        });

        expect(result.current.state.phase).toBe('submitting');

        // Wait for POST to resolve and polling to start
        await act(async () => {
            await Promise.resolve();
        });

        expect(result.current.state.phase).toBe('polling');

        // Advance timer to trigger the interval
        await act(async () => {
            await vi.advanceTimersByTimeAsync(5000);
        });

        expect(result.current.state.phase).toBe('completed');
        if (result.current.state.phase === 'completed') {
            expect(result.current.state.script).toBe('Generated script content');
        }
    });

    it('rate-limit error (429) → error state with correct message', async () => {
        mockPost.mockRejectedValue({ status: 429, message: 'Rate limit' });

        const { result } = renderHook(() => useGenerateScript());

        await act(async () => {
            result.current.generate('My story');
            await Promise.resolve();
        });

        expect(result.current.state.phase).toBe('error');
        if (result.current.state.phase === 'error') {
            expect(result.current.state.message).toBe(
                'Limit reached. Try again in a minute.',
            );
        }
    });

    it('network error → error state with connection message', async () => {
        mockPost.mockRejectedValue(new Error('Network failure'));

        const { result } = renderHook(() => useGenerateScript());

        await act(async () => {
            result.current.generate('My story');
            await Promise.resolve();
        });

        expect(result.current.state.phase).toBe('error');
        if (result.current.state.phase === 'error') {
            expect(result.current.state.message).toBe(
                'Connection error. Check your internet.',
            );
        }
    });

    it('polling error → transitions to error state', async () => {
        mockPost.mockResolvedValue({
            jobId: 'job-2',
            status: 'pending',
            createdAt: '2026-01-01T00:00:00Z',
        });
        mockPoll.mockRejectedValue({ status: 500, message: 'Server error' });

        const { result } = renderHook(() => useGenerateScript());

        await act(async () => {
            result.current.generate('My story');
            await Promise.resolve();
        });

        await act(async () => {
            await vi.advanceTimersByTimeAsync(5000);
        });

        expect(result.current.state.phase).toBe('error');
    });

    it('job failed → error with backend message', async () => {
        mockPost.mockResolvedValue({
            jobId: 'job-3',
            status: 'pending',
            createdAt: '2026-01-01T00:00:00Z',
        });
        mockPoll.mockResolvedValue({
            jobId: 'job-3',
            status: 'failed',
            message: 'AI provider unavailable',
        });

        const { result } = renderHook(() => useGenerateScript());

        await act(async () => {
            result.current.generate('My story');
            await Promise.resolve();
        });

        await act(async () => {
            await vi.advanceTimersByTimeAsync(5000);
        });

        expect(result.current.state.phase).toBe('error');
        if (result.current.state.phase === 'error') {
            expect(result.current.state.message).toBe('AI provider unavailable');
        }
    });

    it('polling timeout after 200 attempts → error state', async () => {
        mockPost.mockResolvedValue({
            jobId: 'job-4',
            status: 'pending',
            createdAt: '2026-01-01T00:00:00Z',
        });
        mockPoll.mockResolvedValue({ jobId: 'job-4', status: 'processing' });

        const { result } = renderHook(() => useGenerateScript());

        await act(async () => {
            result.current.generate('My story');
            await Promise.resolve();
        });

        expect(result.current.state.phase).toBe('polling');

        await act(async () => {
            await vi.advanceTimersByTimeAsync(401 * 5000); // 401 ticks × 5000 ms (MAX_ATTEMPTS=400)
        });

        expect(result.current.state.phase).toBe('error');
        if (result.current.state.phase === 'error') {
            expect(result.current.state.message).toBe(
                'Generation took too long. Try again.',
            );
        }
    });

    it('reset() returns to idle state', async () => {
        mockPost.mockRejectedValue({ status: 429, message: 'Rate limit' });

        const { result } = renderHook(() => useGenerateScript());

        await act(async () => {
            result.current.generate('My story');
            await Promise.resolve();
        });

        expect(result.current.state.phase).toBe('error');

        act(() => {
            result.current.reset();
        });

        expect(result.current.state.phase).toBe('idle');
    });

    it('interval is cleared after reaching completed state', async () => {
        mockPost.mockResolvedValue({
            jobId: 'job-5',
            status: 'pending',
            createdAt: '2026-01-01T00:00:00Z',
        });
        mockPoll.mockResolvedValue({
            jobId: 'job-5',
            status: 'completed',
            script: 'Done',
        });

        const { result } = renderHook(() => useGenerateScript());

        await act(async () => {
            result.current.generate('My story');
            await Promise.resolve();
        });

        await act(async () => {
            await vi.advanceTimersByTimeAsync(5000);
        });

        expect(result.current.state.phase).toBe('completed');

        // Advancing more time should not trigger additional poll calls
        const callsBefore = mockPoll.mock.calls.length;
        await act(async () => {
            await vi.advanceTimersByTimeAsync(9000);
        });
        expect(mockPoll.mock.calls.length).toBe(callsBefore);
    });
});
