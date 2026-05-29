import type { AuthResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

type ApiError = { status: number; message: string };

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

export async function registerUser(email: string, password: string, name: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  return handleResponse<AuthResponse>(res);
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<AuthResponse>(res);
}

export async function getCurrentUser(token: string) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res);
}

export async function refreshToken(expiredToken: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: expiredToken }),
  });
  return handleResponse<AuthResponse>(res);
}

export function getGoogleOAuthUrl() {
  return `${API_BASE}/auth/google`;
}
