import { apiDelete, apiGet, apiPost } from '@/shared/lib/api';
import type { AuthResponse, AuthUser } from '@/shared/types';

export interface RegisterPayload {
  email: string;
  phone?: string;
  password: string;
  name: string;
  surname?: string;
  locale?: string;
  role?: 'student' | 'tutor';
}

export interface LoginPayload {
  email_or_phone: string;
  password: string;
}

export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/api/auth/register', payload);
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/api/auth/login', payload);
}

export async function refreshToken(refreshToken: string): Promise<{ access_token: string }> {
  return apiPost<{ access_token: string }>('/api/auth/refresh', {
    refresh_token: refreshToken,
  });
}

export async function logoutUser(refreshToken: string): Promise<void> {
  await apiPost('/api/auth/logout', { refresh_token: refreshToken });
}

export async function getMe(): Promise<AuthUser> {
  return apiGet<AuthUser>('/api/auth/me');
}

export async function forgotPassword(emailOrPhone: string): Promise<void> {
  await apiPost('/api/auth/forgot-password', { email_or_phone: emailOrPhone });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiPost('/api/auth/reset-password', { token, new_password: newPassword });
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  await apiPost('/api/auth/change-password', {
    old_password: oldPassword,
    new_password: newPassword,
  });
}

export interface AuthSession {
  id: string;
  user_agent: string | null;
  ip_address: string | null;
  expires_at: string;
  created_at: string;
  is_current: boolean;
}

export async function listSessions(currentRefreshToken?: string | null): Promise<AuthSession[]> {
  const qs = currentRefreshToken
    ? `?current_refresh_token=${encodeURIComponent(currentRefreshToken)}`
    : '';
  return apiGet<AuthSession[]>(`/api/auth/sessions${qs}`);
}

export async function revokeSession(id: string): Promise<void> {
  await apiDelete(`/api/auth/sessions/${id}`);
}

export async function deleteAccount(password: string, reason?: string): Promise<void> {
  await apiPost('/api/auth/account/delete', { password, reason });
}
