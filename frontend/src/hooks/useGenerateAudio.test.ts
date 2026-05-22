import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGenerateAudio } from './useGenerateAudio';
import * as generateApi from '@/services/generateApi';

vi.mock('@/services/generateApi');

const mockPost = vi.mocked(generateApi.postGenerateAudio);
const mockPoll = vi.mocked(generateApi.getJobStatus);

beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('useGenerateAudio', () => {
    it('starts in idle phase', () => {
        const { result } = renderHook(() => useGenerateAudio());
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
            result: {
                audioUrl: 'https://audio.example.com/1.mp3',
                audioLength: 45,
                textUsed: 'First 100 chars...',
                generatedAt: '2026-01-01T00:00:00Z',
            },
        });

        const { result } = renderHook(() => useGenerateAudio());

        act(() => {
            result.current.generate('script-1');
        });

        expect(result.current.state.phase).toBe('submitting');

        await act(async () => {
            await Promise.resolve();
        });

        expect(result.current.state.phase).toBe('polling');

        await act(async () => {
            await vi.advanceTimersByTimeAsync(3000);
        });

        expect(result.current.state.phase).toBe('completed');
        if (result.current.state.phase === 'completed') {
            expect(result.current.state.audioUrl).toBe('https://audio.example.com/1.mp3');
            expect(result.current.state.audioLength).toBe(45);
        }
    });

    it('passes voiceId when provided', async () => {
        mockPost.mockResolvedValue({ jobId: 'job-2', status: 'pending', createdAt: '2026-01-01T00:00:00Z' });
        mockPoll.mockResolvedValue({ jobId: 'job-2', status: 'processing' });

        const { result } = renderHook(() => useGenerateAudio());

        act(() => { result.current.generate('script-2', 'EXAVITQu4vr4xnSDxMaL'); });

        await act(async () => { await Promise.resolve(); });

        expect(mockPost).toHaveBeenCalledWith(
            { scriptId: 'script-2', voiceId: 'EXAVITQu4vr4xnSDxMaL' },
        );
    });

    it('job failed → error with backend error field', async () => {
        mockPost.mockResolvedValue({ jobId: 'job-3', status: 'pending', createdAt: '2026-01-01T00:00:00Z' });
        mockPoll.mockResolvedValue({ jobId: 'job-3', status: 'failed', error: 'ElevenLabs unavailable' });

        const { result } = renderHook(() => useGenerateAudio());

        await act(async () => {
            result.current.generate('script-3');
            await Promise.resolve();
        });

        await act(async () => {
            await vi.advanceTimersByTimeAsync(3000);
        });

        expect(result.current.state.phase).toBe('error');
        if (result.current.state.phase === 'error') {
            expect(result.current.state.message).toBe('ElevenLabs unavailable');
        }
    });

    it('polling error → transitions to error state', async () => {
        mockPost.mockResolvedValue({ jobId: 'job-4', status: 'pending', createdAt: '2026-01-01T00:00:00Z' });
        mockPoll.mockRejectedValue({ status: 500, message: 'Server error' });

        const { result } = renderHook(() => useGenerateAudio());

        await act(async () => {
            result.current.generate('script-4');
            await Promise.resolve();
        });

        await act(async () => {
            await vi.advanceTimersByTimeAsync(3000);
        });

        expect(result.current.state.phase).toBe('error');
    });

    it('401 error → session expired message', async () => {
        mockPost.mockRejectedValue({ status: 401, message: 'Unauthorized' });

        const { result } = renderHook(() => useGenerateAudio());

        await act(async () => {
            result.current.generate('script-5');
            await Promise.resolve();
        });

        expect(result.current.state.phase).toBe('error');
        if (result.current.state.phase === 'error') {
            expect(result.current.state.message).toBe('Tu sesión expiró. Volvé a iniciar sesión.');
        }
    });

    it('429 error → rate limit message', async () => {
        mockPost.mockRejectedValue({ status: 429, message: 'Rate limit' });

        const { result } = renderHook(() => useGenerateAudio());

        await act(async () => {
            result.current.generate('script-6');
            await Promise.resolve();
        });

        expect(result.current.state.phase).toBe('error');
        if (result.current.state.phase === 'error') {
            expect(result.current.state.message).toBe('Límite alcanzado. Intentá en un minuto.');
        }
    });

    it('timeout fires at 10 attempts (30 s) → correct error message', async () => {
        mockPost.mockResolvedValue({ jobId: 'job-7', status: 'pending', createdAt: '2026-01-01T00:00:00Z' });
        mockPoll.mockResolvedValue({ jobId: 'job-7', status: 'processing' });

        const { result } = renderHook(() => useGenerateAudio());

        await act(async () => {
            result.current.generate('script-7');
            await Promise.resolve();
        });

        expect(result.current.state.phase).toBe('polling');

        act(() => {
            vi.advanceTimersByTime(33000); // 11 ticks × 3000 ms
        });

        expect(result.current.state.phase).toBe('error');
        if (result.current.state.phase === 'error') {
            expect(result.current.state.message).toBe(
                'La generación de audio tardó demasiado. Intentá de nuevo.',
            );
        }
    });

    it('duplicate generate() while in-flight is ignored', async () => {
        mockPost.mockResolvedValue({ jobId: 'job-8', status: 'pending', createdAt: '2026-01-01T00:00:00Z' });

        const { result } = renderHook(() => useGenerateAudio());

        act(() => { result.current.generate('script-8'); });
        expect(result.current.state.phase).toBe('submitting');

        act(() => { result.current.generate('script-9'); });

        await act(async () => { await Promise.resolve(); });

        expect(mockPost).toHaveBeenCalledTimes(1);
    });

    it('reset() returns to idle state', async () => {
        mockPost.mockRejectedValue({ status: 429, message: 'Rate limit' });

        const { result } = renderHook(() => useGenerateAudio());

        await act(async () => {
            result.current.generate('script-10');
            await Promise.resolve();
        });

        expect(result.current.state.phase).toBe('error');

        act(() => { result.current.reset(); });

        expect(result.current.state.phase).toBe('idle');
    });

    it('interval is cleared after reaching completed state', async () => {
        mockPost.mockResolvedValue({ jobId: 'job-9', status: 'pending', createdAt: '2026-01-01T00:00:00Z' });
        mockPoll.mockResolvedValue({
            jobId: 'job-9',
            status: 'completed',
            result: { audioUrl: 'https://audio.example.com/done.mp3', audioLength: 30, textUsed: 'done', generatedAt: '2026-01-01T00:00:00Z' },
        });

        const { result } = renderHook(() => useGenerateAudio());

        await act(async () => {
            result.current.generate('script-11');
            await Promise.resolve();
        });

        await act(async () => { await vi.advanceTimersByTimeAsync(3000); });

        expect(result.current.state.phase).toBe('completed');

        const callsBefore = mockPoll.mock.calls.length;
        await act(async () => { await vi.advanceTimersByTimeAsync(9000); });
        expect(mockPoll.mock.calls.length).toBe(callsBefore);
    });
});
