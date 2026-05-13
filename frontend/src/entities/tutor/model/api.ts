import type { ContactChannel } from '@/shared/config/constants';
import { apiGet, apiPost } from '@/shared/lib/api';
import type { ContactLinks, ContactsRevealed } from '@/shared/types';

import type {
  CatalogFilters,
  TutorFull,
  TutorPublic,
  TutorsListResponse,
} from './types';

export function buildTutorQuery(filters: CatalogFilters = {}): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (typeof value === 'boolean' && !value) return;
    params.append(key, String(value));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function getTutorsList(
  filters: CatalogFilters = {},
): Promise<TutorsListResponse> {
  return apiGet<TutorsListResponse>(`/api/tutors${buildTutorQuery(filters)}`);
}

export async function getTutorBySlug(slug: string): Promise<TutorFull> {
  return apiGet<TutorFull>(`/api/tutors/${slug}`);
}

export async function getSimilarTutors(
  slug: string,
  limit = 6,
): Promise<TutorPublic[]> {
  return apiGet<TutorPublic[]>(`/api/tutors/${slug}/similar?limit=${limit}`);
}

export interface RevealContactsResponse extends ContactsRevealed {
  links: ContactLinks;
}

export async function revealContacts(
  slug: string,
  captchaToken?: string,
): Promise<RevealContactsResponse> {
  return apiPost<RevealContactsResponse>(`/api/tutors/${slug}/reveal-contacts`, {
    captcha_token: captchaToken,
  });
}

export async function logContactClick(
  slug: string,
  channel: ContactChannel,
): Promise<void> {
  await apiPost<{ success: boolean }>(`/api/tutors/${slug}/contact-click`, {
    channel,
  });
}
