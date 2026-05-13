import { apiGet, apiPost } from '@/shared/lib/api';

import type {
  PostCategory,
  PostFilters,
  PostFull,
  PostListItem,
  PostsListResponse,
} from './types';

function buildQuery(params: Record<string, unknown>) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    usp.set(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : '';
}

export async function getPosts(filters: PostFilters = {}): Promise<PostsListResponse> {
  return apiGet<PostsListResponse>(`/api/posts${buildQuery(filters as Record<string, unknown>)}`);
}

export async function getFeaturedPost(locale?: string): Promise<PostListItem | null> {
  return apiGet<PostListItem | null>(`/api/posts/featured${buildQuery({ locale })}`);
}

export async function getPostCategories(locale?: string): Promise<PostCategory[]> {
  return apiGet<PostCategory[]>(`/api/posts/categories${buildQuery({ locale })}`);
}

export async function getPostBySlug(slug: string, locale?: string): Promise<PostFull> {
  return apiGet<PostFull>(`/api/posts/${slug}${buildQuery({ locale })}`);
}

export async function getRelatedPosts(slug: string, locale?: string): Promise<PostListItem[]> {
  return apiGet<PostListItem[]>(`/api/posts/${slug}/related${buildQuery({ locale })}`);
}

export async function searchPosts(
  q: string,
  options: { page?: number; limit?: number; locale?: string } = {},
): Promise<PostsListResponse> {
  return apiGet<PostsListResponse>(`/api/posts/search${buildQuery({ q, ...options })}`);
}

export async function likePost(slug: string): Promise<{ likes_count: number }> {
  return apiPost<{ likes_count: number }>(`/api/posts/${slug}/like`);
}
