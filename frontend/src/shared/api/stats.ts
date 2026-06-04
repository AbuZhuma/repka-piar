import { apiGet } from '@/shared/lib/api';

export interface PlatformStats {
  tutors_total: number;
  subjects_total: number;
  cities_total: number;
  posts_published: number;
  avg_rating: number | null;
  reviews_total: number;
}

export function getPlatformStats(): Promise<PlatformStats> {
  return apiGet<PlatformStats>('/api/stats');
}
