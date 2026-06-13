import type { StoryStyle, ImageGenerationResult, AudioGenerationResult } from '../types';
import { getAuthToken } from '@/features/auth';

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
        if (typeof body.message === 'string') {
          message = body.message;
        }
    } catch {
        // ignore parse error
    }
    
    // Map specific error patterns to user-friendly messages
    if (message.includes('not available') && message.includes('language')) {
      message = 'Esta voz no está disponible para este idioma.';
    } else if (message.includes('Unsupported voice')) {
      message = 'Esta voz no está disponible en este momento. Intenta con otra.';
    } else if (res.status === 500 && message === 'Internal server error') {
      message = 'Error temporal en el servicio de voz. Intenta de nuevo.';
    } else if (res.status === 404) {
      message = 'Recurso no encontrado. Intenta con otra voz.';
    }
    
    const err: ApiError = { status: res.status, message };
    throw err;
}

export async function postGenerateScript(
    body: { title: string; story: string; tone?: string; targetDuration?: number; targetScenes?: number; language?: string },
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
    body: { scriptId: string; language?: string; voiceId?: string },
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

export async function getAvailableVoices(language: string = 'en'): Promise<{
    language: string;
    voices: Array<{ id: string; name: string; provider: 'azure-tts' | 'azure-speech'; tag: string }>;
    count: number;
}> {
    const res = await fetch(`${API_BASE}/generate/voices?language=${language}`, {
        headers: getHeaders(),
    });
    return handleResponse(res);
}

export async function getVoiceSample(
    voiceId: string,
    language: string = 'en',
    provider?: 'azure-tts' | 'azure-speech',
): Promise<{ audioUrl: string; voiceId: string; language: string }> {
    const url = new URL(`${API_BASE}/generate/voice-sample/${voiceId}`);
    url.searchParams.set('language', language);
    if (provider) url.searchParams.set('provider', provider);

    const res = await fetch(url.toString(), {
        headers: getHeaders(),
    });
    return handleResponse(res);
}
