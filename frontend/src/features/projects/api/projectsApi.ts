import { getAuthToken } from '@/features/auth';
import type { Project } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

type ApiError = { status: number; message: string };

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) return res.json() as Promise<T>;
  let message = 'Connection error. Check your internet.';
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
