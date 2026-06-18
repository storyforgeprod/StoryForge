import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGenerateImages } from './useGenerateImages';
import * as generateApi from '../api/generateApi';

vi.mock('../api/generateApi');

const mockPost = vi.mocked(generateApi.postGenerateImages);
const mockPoll = vi.mocked(generateApi.getJobStatus);

beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('useGenerateImages', () => {
    it('starts in idle phase', () => {
        const { result } = renderHook(() => useGenerateImages());
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
            result: { imageUrls: ['https://img.example.com/1.png'], prompt: 'test', generatedAt: '2026-01-01T00:00:00Z' },
        });

        const { result } = renderHook(() => useGenerateImages());

        act(() => {
            result.current.generate('script-1', 'anime');
        });

        expect(result.current.state.phase).toBe('submitting');

        await act(async () => {
            await Promise.resolve();
        });

        expect(result.current.state.phase).toBe('polling');

        await act(async () => {
            await vi.advanceTimersByTimeAsync(5000);
        });

        expect(result.current.state.phase).toBe('completed');
        if (result.current.state.phase === 'completed') {
            expect(result.current.state.imageUrls).toEqual(['https://img.example.com/1.png']);
        }
    });

    it('job failed → error with backend error field', async () => {
        mockPost.mockResolvedValue({ jobId: 'job-2', status: 'pending', createdAt: '2026-01-01T00:00:00Z' });
        mockPoll.mockResolvedValue({ jobId: 'job-2', status: 'failed', error: 'Replicate unavailable' });

        const { result } = renderHook(() => useGenerateImages());

        await act(async () => {
            result.current.generate('script-2', 'manga');
            await Promise.resolve();
        });

        await act(async () => {
            await vi.advanceTimersByTimeAsync(5000);
        });

        expect(result.current.state.phase).toBe('error');
        if (result.current.state.phase === 'error') {
            expect(result.current.state.message).toBe('Replicate unavailable');
        }
    });

    it('polling error → transitions to error state', async () => {
        mockPost.mockResolvedValue({ jobId: 'job-3', status: 'pending', createdAt: '2026-01-01T00:00:00Z' });
        mockPoll.mockRejectedValue({ status: 500, message: 'Server error' });

        const { result } = renderHook(() => useGenerateImages());

        await act(async () => {
            result.current.generate('script-3', 'webtoon');
            await Promise.resolve();
        });

        await act(async () => {
            await vi.advanceTimersByTimeAsync(5000);
        });

        expect(result.current.state.phase).toBe('error');
    });

    it('401 error → session expired message', async () => {
        mockPost.mockRejectedValue({ status: 401, message: 'Unauthorized' });

        const { result } = renderHook(() => useGenerateImages());

        await act(async () => {
            result.current.generate('script-4', 'anime');
            await Promise.resolve();
        });

        expect(result.current.state.phase).toBe('error');
        if (result.current.state.phase === 'error') {
            expect(result.current.state.message).toBe('Your session expired. Sign in again.');
        }
    });

    it('429 error → rate limit message', async () => {
        mockPost.mockRejectedValue({ status: 429, message: 'Rate limit' });

        const { result } = renderHook(() => useGenerateImages());

        await act(async () => {
            result.current.generate('script-5', 'anime');
            await Promise.resolve();
        });

        expect(result.current.state.phase).toBe('error');
        if (result.current.state.phase === 'error') {
            expect(result.current.state.message).toBe('Limit reached. Try again in a minute.');
        }
    });

    it('timeout fires at 200 attempts (1000 s) → correct error message', async () => {
        mockPost.mockResolvedValue({ jobId: 'job-6', status: 'pending', createdAt: '2026-01-01T00:00:00Z' });
        mockPoll.mockResolvedValue({ jobId: 'job-6', status: 'processing' });

        const { result } = renderHook(() => useGenerateImages());

        await act(async () => {
            result.current.generate('script-6', 'novel');
            await Promise.resolve();
        });

        expect(result.current.state.phase).toBe('polling');

        await act(async () => {
            await vi.advanceTimersByTimeAsync(401 * 5000); // 401 ticks × 5000 ms (MAX_ATTEMPTS=400)
        });

        expect(result.current.state.phase).toBe('error');
        if (result.current.state.phase === 'error') {
            expect(result.current.state.message).toBe(
                'Image generation took too long. Try again.',
            );
        }
    });

    it('duplicate generate() while in-flight is ignored', async () => {
        mockPost.mockResolvedValue({ jobId: 'job-7', status: 'pending', createdAt: '2026-01-01T00:00:00Z' });

        const { result } = renderHook(() => useGenerateImages());

        act(() => {
            result.current.generate('script-7', 'anime');
        });

        expect(result.current.state.phase).toBe('submitting');

        act(() => {
            result.current.generate('script-8', 'manga');
        });

        await act(async () => { await Promise.resolve(); });

        expect(mockPost).toHaveBeenCalledTimes(1);
    });

    it('reset() returns to idle state', async () => {
        mockPost.mockRejectedValue({ status: 429, message: 'Rate limit' });

        const { result } = renderHook(() => useGenerateImages());

        await act(async () => {
            result.current.generate('script-9', 'anime');
            await Promise.resolve();
        });

        expect(result.current.state.phase).toBe('error');

        act(() => { result.current.reset(); });

        expect(result.current.state.phase).toBe('idle');
    });

    it('interval is cleared after reaching completed state', async () => {
        mockPost.mockResolvedValue({ jobId: 'job-8', status: 'pending', createdAt: '2026-01-01T00:00:00Z' });
        mockPoll.mockResolvedValue({
            jobId: 'job-8',
            status: 'completed',
            result: { imageUrls: ['https://img.example.com/done.png'], prompt: 'p', generatedAt: '2026-01-01T00:00:00Z' },
        });

        const { result } = renderHook(() => useGenerateImages());

        await act(async () => {
            result.current.generate('script-10', 'anime');
            await Promise.resolve();
        });

        await act(async () => { await vi.advanceTimersByTimeAsync(5000); });

        expect(result.current.state.phase).toBe('completed');

        const callsBefore = mockPoll.mock.calls.length;
        await act(async () => { await vi.advanceTimersByTimeAsync(9000); });
        expect(mockPoll.mock.calls.length).toBe(callsBefore);
    });
});
