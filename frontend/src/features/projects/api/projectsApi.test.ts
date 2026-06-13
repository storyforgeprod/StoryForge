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
