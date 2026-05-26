import type { StoryStyle, ImageGenerationResult, AudioGenerationResult } from '@/types/generate';
import { getAuthToken } from '@/contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

type ApiError = { status: number; message: string };

function getHeaders(additionalHeaders: Record<string, string> = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

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

export async function postGenerateScript(
    body: { story: string; style: StoryStyle },
): Promise<{ jobId: string; status: string; createdAt: string }> {
    const res = await fetch(`${API_BASE}/generate/script`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
    });
    return handleResponse(res);
}

export async function getJobStatus(
    jobId: string,
): Promise<{
    jobId: string;
    status: string;
    progress?: number;
    script?: string;
    result?: ImageGenerationResult | AudioGenerationResult | unknown;
    error?: string | null;
    message?: string;
    completedAt?: string;
}> {
    const res = await fetch(`${API_BASE}/generate/job/${jobId}`, {
        headers: getHeaders(),
    });
    return handleResponse(res);
}

export async function postGenerateImages(
    body: { scriptId: string; style: StoryStyle; imageDescription?: string },
): Promise<{ jobId: string; status: string; createdAt: string }> {
    const res = await fetch(`${API_BASE}/generate/images`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
    });
    return handleResponse(res);
}

export async function postGenerateAudio(
    body: { scriptId: string; voiceId?: string },
): Promise<{ jobId: string; status: string; createdAt: string }> {
    const res = await fetch(`${API_BASE}/generate/audio`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
    });
    return handleResponse(res);
}

export async function postGenerateVideo(
    body: { imageJobId: string; audioJobId: string; fps?: number; bitrate?: string },
): Promise<{ jobId: string; status: string; createdAt: string }> {
    const res = await fetch(`${API_BASE}/generate/video`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
    });
    return handleResponse(res);
}

export async function postPreset(
    type: 'script' | 'images' | 'audio',
    body: { content?: string; jobId?: string },
): Promise<{ jobId: string; type: string }> {
    const res = await fetch(`${API_BASE}/generate/preset/${type}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
    });
    return handleResponse(res);
}
