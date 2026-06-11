import { describe, it, expect, vi, afterEach } from 'vitest';
import { postGenerateScript, getJobStatus } from './generateApi';

afterEach(() => {
    vi.unstubAllGlobals();
});

function makeFetchMock(ok: boolean, status: number, body: unknown) {
    return vi.fn().mockResolvedValue({
        ok,
        status,
        json: () => Promise.resolve(body),
    });
}

describe('postGenerateScript', () => {
    it('sends POST with correct method, URL, headers, and body', async () => {
        const mockFetch = makeFetchMock(true, 200, {
            jobId: 'job-1',
            status: 'pending',
            createdAt: '2026-01-01T00:00:00Z',
        });
        vi.stubGlobal('fetch', mockFetch);

        const result = await postGenerateScript({ story: 'my story', style: 'anime' });

        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/generate/script'),
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                }),
                body: JSON.stringify({ story: 'my story', style: 'anime' }),
            }),
        );
        expect(result.jobId).toBe('job-1');
        expect(result.status).toBe('pending');
    });

    it('throws typed error on 400', async () => {
        vi.stubGlobal(
            'fetch',
            makeFetchMock(false, 400, { message: 'Validation error' }),
        );

        await expect(
            postGenerateScript({ story: 'x', style: 'manga' }),
        ).rejects.toMatchObject({ status: 400 });
    });

    it('throws typed error on 401', async () => {
        vi.stubGlobal('fetch', makeFetchMock(false, 401, { message: 'Unauthorized' }));

        await expect(
            postGenerateScript({ story: 'x', style: 'manga' }),
        ).rejects.toMatchObject({ status: 401 });
    });

    it('throws typed error on 429', async () => {
        vi.stubGlobal(
            'fetch',
            makeFetchMock(false, 429, { message: 'Rate limit exceeded' }),
        );

        await expect(
            postGenerateScript({ story: 'x', style: 'manga' }),
        ).rejects.toMatchObject({ status: 429 });
    });

    it('throws typed error on 500', async () => {
        vi.stubGlobal(
            'fetch',
            makeFetchMock(false, 500, { message: 'Internal server error' }),
        );

        await expect(
            postGenerateScript({ story: 'x', style: 'manga' }),
        ).rejects.toMatchObject({ status: 500 });
    });

    it('sends tone in request body when provided', async () => {
        const mockFetch = makeFetchMock(true, 200, {
            jobId: 'job-1',
            status: 'pending',
            createdAt: '2026-01-01T00:00:00Z',
        });
        vi.stubGlobal('fetch', mockFetch);
        localStorage.setItem('storyforge_token', 'test-token');

        await postGenerateScript({ story: 'test story', tone: 'dramatic' });
        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body.tone).toBe('dramatic');
    });
});

describe('getJobStatus', () => {
    it('sends GET to correct URL and returns parsed response', async () => {
        const mockFetch = makeFetchMock(true, 200, {
            jobId: 'job-1',
            status: 'completed',
            script: 'Generated script',
        });
        vi.stubGlobal('fetch', mockFetch);

        const result = await getJobStatus('job-1');

        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/generate/job/job-1'),
            expect.any(Object),
        );
        expect(result.status).toBe('completed');
        expect(result.script).toBe('Generated script');
    });

    it('throws typed error on non-200', async () => {
        vi.stubGlobal(
            'fetch',
            makeFetchMock(false, 404, { message: 'Job not found' }),
        );

        await expect(getJobStatus('missing-job')).rejects.toMatchObject({
            status: 404,
        });
    });
});
