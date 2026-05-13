import { env } from '@/shared/config/env';
import { auth } from './auth';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  authRequired?: boolean;
}

export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const { body, authRequired, headers: incomingHeaders, ...rest } = options;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...((incomingHeaders ?? {}) as Record<string, string>),
  };

  const token = auth.getAccess();
  if (token && authRequired !== false) {
    headers.Authorization = `Bearer ${token}`;
  }

  const baseUrl = typeof window === 'undefined' ? env.internalApiUrl : env.apiUrl;
  const res = await fetch(`${baseUrl}${path}`, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let errorPayload: { error?: { code?: string; message?: string } } = {};
    try {
      errorPayload = await res.json();
    } catch {
      // empty
    }
    throw new ApiError(
      res.status,
      errorPayload.error?.code ?? 'unknown',
      errorPayload.error?.message ?? `Request failed with status ${res.status}`,
    );
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const apiGet = <T = unknown>(path: string, options?: ApiOptions) =>
  api<T>(path, { ...options, method: 'GET' });
export const apiPost = <T = unknown>(path: string, body?: unknown, options?: ApiOptions) =>
  api<T>(path, { ...options, method: 'POST', body });
export const apiPatch = <T = unknown>(path: string, body?: unknown, options?: ApiOptions) =>
  api<T>(path, { ...options, method: 'PATCH', body });
export const apiDelete = <T = unknown>(path: string, options?: ApiOptions) =>
  api<T>(path, { ...options, method: 'DELETE' });
