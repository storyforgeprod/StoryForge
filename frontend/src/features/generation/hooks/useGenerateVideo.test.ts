import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGenerateVideo } from './useGenerateVideo';
import * as generateApi from '../api/generateApi';

vi.mock('../api/generateApi');

const mockPost = vi.mocked(generateApi.postGenerateVideo);
const mockPoll = vi.mocked(generateApi.getJobStatus);

beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('useGenerateVideo', () => {
    it('starts in idle phase', () => {
        const { result } = renderHook(() => useGenerateVideo());
        expect(result.current.state.phase).toBe('idle');
    });

    it('happy path: idle → submitting → polling → completed with videoUrl', async () => {
        mockPost.mockResolvedValue({ jobId: 'job-1', status: 'pending', createdAt: '2026-01-01T00:00:00Z' });
        mockPoll.mockResolvedValue({
            jobId: 'job-1',
            status: 'completed',
            result: {
                videoUrl: 'https://supabase.example.com/storage/videos/job-1.mp4?token=abc',
                duration: 45,
                fileSize: 12_000_000,
                format: 'mp4',
                generatedAt: '2026-01-01T00:00:00Z',
            },
        });

        const { result } = renderHook(() => useGenerateVideo());

        act(() => { result.current.generate('img-job-1', 'audio-job-1'); });
        expect(result.current.state.phase).toBe('submitting');

        await act(async () => { await Promise.resolve(); });
        expect(result.current.state.phase).toBe('polling');

        await act(async () => { await vi.advanceTimersByTimeAsync(5000); });

        expect(result.current.state.phase).toBe('completed');
        if (result.current.state.phase === 'completed') {
            expect(result.current.state.videoUrl).toBe(
                'https://supabase.example.com/storage/videos/job-1.mp4?token=abc',
            );
            expect(result.current.state.duration).toBe(45);
            expect(result.current.state.fileSize).toBe(12_000_000);
        }
    });

    it('400 error → "Las imágenes o el audio aún no están listos."', async () => {
        mockPost.mockRejectedValue({ status: 400, message: 'Image job not completed' });

        const { result } = renderHook(() => useGenerateVideo());

        await act(async () => {
            result.current.generate('img-job-2', 'audio-job-2');
            await Promise.resolve();
        });

        expect(result.current.state.phase).toBe('error');
        if (result.current.state.phase === 'error') {
            expect(result.current.state.message).toBe(
                'Las imágenes o el audio aún no están listos.',
            );
        }
    });

    it('429 error → rate limit message', async () => {
        mockPost.mockRejectedValue({ status: 429, message: 'Rate limit' });

        const { result } = renderHook(() => useGenerateVideo());

        await act(async () => {
            result.current.generate('img-job-3', 'audio-job-3');
            await Promise.resolve();
        });

        expect(result.current.state.phase).toBe('error');
        if (result.current.state.phase === 'error') {
            expect(result.current.state.message).toBe('Límite alcanzado. Intentá en un minuto.');
        }
    });

    it('job failed → surfaces backend error field', async () => {
        mockPost.mockResolvedValue({ jobId: 'job-4', status: 'pending', createdAt: '2026-01-01T00:00:00Z' });
        mockPoll.mockResolvedValue({ jobId: 'job-4', status: 'failed', error: 'FFmpeg timeout' });

        const { result } = renderHook(() => useGenerateVideo());

        await act(async () => {
            result.current.generate('img-job-4', 'audio-job-4');
            await Promise.resolve();
        });

        await act(async () => { await vi.advanceTimersByTimeAsync(5000); });

        expect(result.current.state.phase).toBe('error');
        if (result.current.state.phase === 'error') {
            expect(result.current.state.message).toBe('FFmpeg timeout');
        }
    });

    it('timeout fires after 200 attempts (1000 s)', async () => {
        mockPost.mockResolvedValue({ jobId: 'job-5', status: 'pending', createdAt: '2026-01-01T00:00:00Z' });
        mockPoll.mockResolvedValue({ jobId: 'job-5', status: 'processing' });

        const { result } = renderHook(() => useGenerateVideo());

        await act(async () => {
            result.current.generate('img-job-5', 'audio-job-5');
            await Promise.resolve();
        });

        expect(result.current.state.phase).toBe('polling');

        await act(async () => {
            await vi.advanceTimersByTimeAsync(401 * 5000); // 401 ticks × 5000 ms (MAX_ATTEMPTS=400)
        });

        expect(result.current.state.phase).toBe('error');
        if (result.current.state.phase === 'error') {
            expect(result.current.state.message).toBe('El ensamblado tardó demasiado. Intentá de nuevo.');
        }
    });

    it('reset() returns to idle from error state', async () => {
        mockPost.mockRejectedValue({ status: 429, message: 'Rate limit' });

        const { result } = renderHook(() => useGenerateVideo());

        await act(async () => {
            result.current.generate('img-job-6', 'audio-job-6');
            await Promise.resolve();
        });

        expect(result.current.state.phase).toBe('error');

        act(() => { result.current.reset(); });

        expect(result.current.state.phase).toBe('idle');
    });

    it('duplicate generate() while in-flight is ignored', async () => {
        mockPost.mockResolvedValue({ jobId: 'job-7', status: 'pending', createdAt: '2026-01-01T00:00:00Z' });

        const { result } = renderHook(() => useGenerateVideo());

        act(() => { result.current.generate('img-job-7a', 'audio-job-7a'); });
        expect(result.current.state.phase).toBe('submitting');

        act(() => { result.current.generate('img-job-7b', 'audio-job-7b'); });

        await act(async () => { await Promise.resolve(); });

        expect(mockPost).toHaveBeenCalledTimes(1);
    });

    it('polling interval is cleared after completing', async () => {
        mockPost.mockResolvedValue({ jobId: 'job-8', status: 'pending', createdAt: '2026-01-01T00:00:00Z' });
        mockPoll.mockResolvedValue({
            jobId: 'job-8',
            status: 'completed',
            result: {
                videoUrl: 'https://supabase.example.com/done.mp4',
                duration: 30,
                fileSize: 5_000_000,
                format: 'mp4',
                generatedAt: '2026-01-01T00:00:00Z',
            },
        });

        const { result } = renderHook(() => useGenerateVideo());

        await act(async () => {
            result.current.generate('img-job-8', 'audio-job-8');
            await Promise.resolve();
        });

        await act(async () => { await vi.advanceTimersByTimeAsync(5000); });

        expect(result.current.state.phase).toBe('completed');

        const callsBefore = mockPoll.mock.calls.length;
        await act(async () => { await vi.advanceTimersByTimeAsync(9000); });
        expect(mockPoll.mock.calls.length).toBe(callsBefore);
    });

    it('passes fps and bitrate opts to postGenerateVideo', async () => {
        mockPost.mockResolvedValue({ jobId: 'job-9', status: 'pending', createdAt: '2026-01-01T00:00:00Z' });
        mockPoll.mockResolvedValue({ jobId: 'job-9', status: 'processing' });

        const { result } = renderHook(() => useGenerateVideo());

        act(() => { result.current.generate('img-9', 'audio-9', { fps: 24, bitrate: '1500k' }); });
        await act(async () => { await Promise.resolve(); });

        expect(mockPost).toHaveBeenCalledWith(
            { imageJobId: 'img-9', audioJobId: 'audio-9', fps: 24, bitrate: '1500k' },
        );
    });
});
