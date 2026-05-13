import { apiDelete, apiGet, apiPatch, apiPost } from '@/shared/lib/api';
import { auth } from '@/shared/lib/auth';
import { env } from '@/shared/config/env';
import type { Block, PostCategory, PostAuthor } from '@/entities/post';

export interface DashboardStats {
  tutors: {
    total: number;
    active: number;
    pending_verification: number;
    rejected: number;
    new_this_week: number;
  };
  posts: { total: number; published: number; drafts: number; archived: number };
  feedback: { new: number; in_progress: number; closed: number; unread: number };
  activity: {
    profile_views_week: number;
    contact_clicks_week: number;
    registrations_week: number;
  };
  recent_pending_tutors: Array<{
    id: string;
    user_id: string;
    name: string;
    surname: string;
    email: string;
    photo_url: string | null;
    status: string;
    created_at: string;
    experience_years: number;
  }>;
  recent_feedback: Array<{
    id: string;
    name: string | null;
    email: string | null;
    topic: string | null;
    message: string;
    status: string;
    created_at: string;
  }>;
}

export interface AdminTutorListItem {
  id: string;
  user_id: string;
  slug: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  photo_url: string | null;
  status: string;
  verified: boolean;
  experience_years: number;
  views_count: number;
  contact_clicks_count: number;
  created_at: string;
}

export interface AdminTutorFull {
  profile: Record<string, unknown> & { id: string; slug: string };
  user: Record<string, unknown> & { name: string; surname: string; email: string };
  subjects: Array<Record<string, unknown>>;
  education: Array<Record<string, unknown>>;
  experience: Array<Record<string, unknown>>;
  documents: Array<Record<string, unknown>>;
  history: Array<{
    id: string;
    admin_id: string;
    admin_name: string | null;
    action: string;
    reason: string | null;
    notes: string | null;
    created_at: string;
  }>;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}
export interface Paginated<T> {
  data: T[];
  pagination: Pagination;
}

export interface AdminPostListItem {
  id: string;
  slug: string;
  title_ru: string;
  status: string;
  category_id: string | null;
  category_name: string | null;
  author_id: string | null;
  author_name: string | null;
  cover_url: string | null;
  published_at: string | null;
  views_count: number;
  is_featured: boolean;
  is_pinned: boolean;
  created_at: string;
}

export interface AdminPost {
  id: string;
  slug: string;
  title_ru: string;
  title_kg: string | null;
  title_en: string | null;
  excerpt_ru: string | null;
  excerpt_kg: string | null;
  excerpt_en: string | null;
  content_ru: Block[];
  content_kg: Block[] | null;
  content_en: Block[] | null;
  cover_url: string | null;
  category_id: string | null;
  author_id: string | null;
  tags: string[];
  reading_time: number | null;
  status: string;
  published_at: string | null;
  views_count: number;
  is_featured: boolean;
  is_pinned: boolean;
  seo_title: string | null;
  seo_description: string | null;
  seo_og_image: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminCategory extends PostCategory {
  name_ru: string;
  name_kg: string | null;
  name_en: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface AdminAuthor extends PostAuthor {
  socials: Record<string, string>;
  created_at: string;
  user_id: string | null;
}

export interface AdminFeedback {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  topic: string | null;
  message: string;
  status: string;
  notes: string | null;
  handled_by: string | null;
  handled_at: string | null;
  created_at: string;
}

export interface AdminUserListItem {
  id: string;
  email: string;
  phone: string;
  name: string;
  surname: string;
  roles: string[];
  is_blocked: boolean;
  email_verified: boolean;
  created_at: string;
  has_tutor_profile: boolean;
}

export interface SiteSetting {
  key: string;
  value: unknown;
  updated_at: string;
}

export interface AdminMediaItem {
  id: string;
  url: string;
  filename: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  created_at: string;
}

const buildQs = (q: Record<string, unknown>) => {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null || v === '') continue;
    usp.set(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : '';
};

// Dashboard
export const getDashboard = () => apiGet<DashboardStats>('/api/admin/dashboard');

// Tutors
export const adminListTutors = (
  filters: { status?: string; q?: string; page?: number; limit?: number } = {},
) => apiGet<Paginated<AdminTutorListItem>>(`/api/admin/tutors${buildQs(filters)}`);
export const adminListPendingTutors = () =>
  apiGet<Paginated<AdminTutorListItem>>('/api/admin/tutors/pending');
export const adminGetTutor = (id: string) =>
  apiGet<AdminTutorFull>(`/api/admin/tutors/${id}`);
export const adminApproveTutor = (id: string, notes?: string) =>
  apiPost<{ ok: boolean }>(`/api/admin/tutors/${id}/approve`, { notes });
export const adminRejectTutor = (id: string, reason: string, notes?: string) =>
  apiPost<{ ok: boolean }>(`/api/admin/tutors/${id}/reject`, { reason, notes });
export const adminRequestTutorChanges = (id: string, reason: string, notes?: string) =>
  apiPost<{ ok: boolean }>(`/api/admin/tutors/${id}/request-changes`, { reason, notes });
export const adminBlockTutor = (id: string, reason?: string) =>
  apiPost<{ ok: boolean }>(`/api/admin/tutors/${id}/block`, { reason });
export const adminUnblockTutor = (id: string) =>
  apiPost<{ ok: boolean }>(`/api/admin/tutors/${id}/unblock`);
export const adminDeleteTutor = (id: string) => apiDelete(`/api/admin/tutors/${id}`);

// Posts
export const adminListPosts = (
  filters: {
    status?: string;
    category_id?: string;
    author_id?: string;
    q?: string;
    page?: number;
    limit?: number;
  } = {},
) => apiGet<Paginated<AdminPostListItem>>(`/api/admin/posts${buildQs(filters)}`);
export const adminGetPost = (id: string) => apiGet<AdminPost>(`/api/admin/posts/${id}`);
export const adminCreatePost = (payload: {
  slug: string;
  title_ru: string;
  excerpt_ru?: string;
  content_ru?: Block[];
  category_id?: string;
  author_id?: string;
  cover_url?: string;
}) => apiPost<AdminPost>('/api/admin/posts', payload);
export const adminUpdatePost = (id: string, patch: Partial<AdminPost>) =>
  apiPatch<AdminPost>(`/api/admin/posts/${id}`, patch);
export const adminPublishPost = (id: string) =>
  apiPost<AdminPost>(`/api/admin/posts/${id}/publish`);
export const adminUnpublishPost = (id: string) =>
  apiPost<AdminPost>(`/api/admin/posts/${id}/unpublish`);
export const adminDeletePost = (id: string) => apiDelete(`/api/admin/posts/${id}`);
export const adminDuplicatePost = (id: string) =>
  apiPost<AdminPost>(`/api/admin/posts/${id}/duplicate`);

// Categories
export const adminListCategories = () => apiGet<AdminCategory[]>('/api/admin/categories');
export const adminCreateCategory = (payload: Partial<AdminCategory>) =>
  apiPost<AdminCategory>('/api/admin/categories', payload);
export const adminUpdateCategory = (id: string, payload: Partial<AdminCategory>) =>
  apiPatch<AdminCategory>(`/api/admin/categories/${id}`, payload);
export const adminDeleteCategory = (id: string) => apiDelete(`/api/admin/categories/${id}`);

// Authors
export const adminListAuthors = () => apiGet<AdminAuthor[]>('/api/admin/authors');
export const adminCreateAuthor = (payload: Partial<AdminAuthor>) =>
  apiPost<AdminAuthor>('/api/admin/authors', payload);
export const adminUpdateAuthor = (id: string, payload: Partial<AdminAuthor>) =>
  apiPatch<AdminAuthor>(`/api/admin/authors/${id}`, payload);
export const adminDeleteAuthor = (id: string) => apiDelete(`/api/admin/authors/${id}`);

// Feedback
export const adminListFeedback = (
  filters: { status?: string; page?: number; limit?: number } = {},
) => apiGet<Paginated<AdminFeedback>>(`/api/admin/feedback${buildQs(filters)}`);
export const adminUpdateFeedback = (
  id: string,
  payload: { status?: string; notes?: string },
) => apiPatch<AdminFeedback>(`/api/admin/feedback/${id}`, payload);

// Users
export const adminListUsers = (
  filters: { role?: string; is_blocked?: boolean; q?: string; page?: number; limit?: number } = {},
) => apiGet<Paginated<AdminUserListItem>>(`/api/admin/users${buildQs(filters)}`);
export const adminBlockUser = (id: string) =>
  apiPost<{ ok: boolean }>(`/api/admin/users/${id}/block`);
export const adminUnblockUser = (id: string) =>
  apiPost<{ ok: boolean }>(`/api/admin/users/${id}/unblock`);
export const adminSetUserRoles = (id: string, roles: string[]) =>
  apiPost<{ ok: boolean }>(`/api/admin/users/${id}/roles`, { roles });
export const adminDeleteUser = (id: string) =>
  apiDelete<{ ok: boolean }>(`/api/admin/users/${id}`);

// Settings
export const adminListSettings = () => apiGet<SiteSetting[]>('/api/admin/settings');
export const adminUpdateSetting = (key: string, value: unknown) =>
  apiPatch<SiteSetting>(`/api/admin/settings/${encodeURIComponent(key)}`, { value });

// Media
export const adminListMedia = (page = 1, limit = 40) =>
  apiGet<Paginated<AdminMediaItem>>(`/api/admin/media?page=${page}&limit=${limit}`);
export const adminDeleteMedia = (id: string) => apiDelete(`/api/admin/media/${id}`);

// Dictionaries
export interface AdminCity {
  id: string;
  slug: string;
  name_ru: string;
  name_kg: string | null;
  name_en: string | null;
  country_code: string;
  timezone: string;
  lat: number | null;
  lng: number | null;
  is_active: boolean;
}

export interface AdminSubject {
  id: string;
  slug: string;
  name_ru: string;
  name_kg: string | null;
  name_en: string | null;
  icon: string | null;
  category: string | null;
  sort_order: number;
}

export const adminListCities = () => apiGet<AdminCity[]>('/api/admin/cities');
export const adminCreateCity = (payload: Partial<AdminCity>) =>
  apiPost<AdminCity>('/api/admin/cities', payload);
export const adminUpdateCity = (id: string, payload: Partial<AdminCity>) =>
  apiPatch<AdminCity>(`/api/admin/cities/${id}`, payload);
export const adminDeleteCity = (id: string) => apiDelete(`/api/admin/cities/${id}`);

export const adminListSubjects = () => apiGet<AdminSubject[]>('/api/admin/subjects');
export const adminCreateSubject = (payload: Partial<AdminSubject>) =>
  apiPost<AdminSubject>('/api/admin/subjects', payload);
export const adminUpdateSubject = (id: string, payload: Partial<AdminSubject>) =>
  apiPatch<AdminSubject>(`/api/admin/subjects/${id}`, payload);
export const adminDeleteSubject = (id: string) => apiDelete(`/api/admin/subjects/${id}`);

// Analytics
export interface AnalyticsTotals {
  users_total: number;
  tutors_total: number;
  tutors_active: number;
  views_total: number;
  clicks_total: number;
  posts_published: number;
  post_views_total: number;
}
export interface TimeSeriesPoint {
  day: string;
  count: number;
}
export interface TopTutorRow {
  id: string;
  slug: string;
  name: string;
  surname: string;
  views_count: number;
  contact_clicks_count: number;
  photo_url: string | null;
}
export interface TopPostRow {
  id: string;
  slug: string;
  title_ru: string;
  views_count: number;
  likes_count: number;
}
export interface DistributionRow {
  slug: string;
  name_ru: string;
  count: number;
}
export interface FullAnalytics {
  totals: AnalyticsTotals;
  views_30d: TimeSeriesPoint[];
  clicks_30d: TimeSeriesPoint[];
  signups_30d: TimeSeriesPoint[];
  top_tutors: TopTutorRow[];
  top_posts: TopPostRow[];
  distribution_by_subject: DistributionRow[];
  distribution_by_city: DistributionRow[];
}
export const adminFullAnalytics = () => apiGet<FullAnalytics>('/api/admin/analytics');

export async function adminUploadMedia(file: File): Promise<AdminMediaItem> {
  const fd = new FormData();
  fd.append('file', file);
  const token = auth.getAccess();
  const res = await fetch(`${env.apiUrl}/api/admin/media/upload`, {
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
  return (await res.json()) as AdminMediaItem;
}
