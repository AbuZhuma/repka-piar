import { apiDelete, apiGet, apiPost } from '@/shared/lib/api';

export interface ReviewAuthor {
  name: string;
  avatar_url: string | null;
}

export interface ReviewItem {
  id: string;
  rating: number;
  text: string | null;
  created_at: string;
  updated_at: string;
  author: ReviewAuthor;
  is_mine: boolean;
}

export interface ReviewsResponse {
  items: ReviewItem[];
  avg_rating: number | null;
  count: number;
  distribution: [number, number, number, number, number];
  my_review: ReviewItem | null;
}

export const getReviews = (slug: string) =>
  apiGet<ReviewsResponse>(`/api/tutors/${encodeURIComponent(slug)}/reviews`);

export const upsertReview = (slug: string, rating: number, text?: string) =>
  apiPost<{ ok: boolean }>(`/api/tutors/${encodeURIComponent(slug)}/reviews`, {
    rating,
    text,
  });

export const deleteMyReview = (slug: string) =>
  apiDelete<{ ok: boolean }>(`/api/tutors/${encodeURIComponent(slug)}/reviews`);
