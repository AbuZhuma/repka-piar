import { env } from '@/shared/config/env';
import { auth } from '@/shared/lib/auth';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/shared/lib/api';

// ---------------------------------------------------------- account & avatar

export interface UpdateMeRequest {
  name?: string;
  surname?: string;
  phone?: string;
  locale?: string;
  avatar_url?: string;
}

export function updateMe(payload: UpdateMeRequest) {
  return apiPatch('/api/auth/me', payload);
}

export interface UploadedAvatar {
  url: string;
}

export async function uploadAvatar(file: File): Promise<UploadedAvatar> {
  const fd = new FormData();
  fd.append('file', file);
  const token = auth.getAccess();
  const res = await fetch(`${env.apiUrl}/api/auth/me/avatar`, {
    method: 'POST',
    body: fd,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) {
    let msg = `Upload failed (${res.status})`;
    try {
      const j = await res.json();
      msg = j?.error?.message ?? msg;
    } catch {
      /* noop */
    }
    throw new Error(msg);
  }
  return (await res.json()) as UploadedAvatar;
}

// ---------------------------------------------------------- email verification

export function verifyEmail(token: string) {
  return apiPost<{ ok: boolean }>('/api/auth/verify-email', { token });
}

export function resendVerification() {
  return apiPost<{ ok: boolean; already_verified?: boolean }>('/api/auth/resend-verification');
}

// ---------------------------------------------------------------- favorites

export interface ApiFavoriteTutor {
  id: string;
  slug: string;
  name: string;
  surname: string;
  photo_url: string | null;
  price_per_60: number | null;
  currency: string;
  specializations: string[];
  rating: number | null;
  reviews_count: number;
  trial_enabled: boolean;
  added_at: string;
}

export const apiListFavorites = () => apiGet<ApiFavoriteTutor[]>('/api/me/favorites');
export const apiAddFavorite = (tutorId: string) =>
  apiPost<{ ok: boolean }>(`/api/me/favorites/${tutorId}`);
export const apiRemoveFavorite = (tutorId: string) =>
  apiDelete<{ ok: boolean }>(`/api/me/favorites/${tutorId}`);
export const apiSyncFavorites = (ids: string[]) =>
  apiPost<{ ok: boolean; merged: number }>(`/api/me/favorites/sync`, { tutor_ids: ids });
