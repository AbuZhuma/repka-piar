import type { ContactChannel } from '@/shared/config/constants';

export interface City {
  id: string;
  slug: string;
  name_ru: string;
  name_kg?: string | null;
  name_en?: string | null;
  timezone: string;
  lat?: number | null;
  lng?: number | null;
}

export interface Subject {
  id: string;
  slug: string;
  name_ru: string;
  name_kg?: string | null;
  name_en?: string | null;
  icon?: string | null;
  category?: string | null;
}

export interface ContactsMasked {
  phone: string | null;
  whatsapp: boolean;
  telegram: boolean;
  email: string | null;
  instagram: boolean;
}

export interface ContactsRevealed {
  phone: string | null;
  whatsapp: string | null;
  telegram: string | null;
  email: string | null;
  instagram: string | null;
}

export interface ContactLinks {
  phone_tel: string | null;
  whatsapp_url: string | null;
  telegram_url: string | null;
  email_mailto: string | null;
  instagram_url: string | null;
}

export interface TutorPrice {
  per_60: number | null;
  per_90: number | null;
  currency: string;
  trial_enabled: boolean;
}

export interface TutorPublic {
  id: string;
  slug: string;
  name: string;
  surname: string;
  bio: string | null;
  short_bio: string | null;
  photo_url: string | null;
  video_url: string | null;
  is_native_speaker: boolean;
  experience_years: number;
  specializations: string[];
  city: City | null;
  address: string | null;
  student_districts: string[] | null;
  schedule_text: string | null;
  price: TutorPrice;
  contacts_masked: ContactsMasked;
  status: string;
  verified: boolean;
  badges: string[];
  views_count: number;
  rating: number | null;
  reviews_count: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface TutorListResponse {
  data: TutorPublic[];
  pagination: Pagination;
}

export interface AuthUser {
  id: string;
  email: string;
  phone: string;
  name: string;
  surname: string;
  roles: string[];
  locale: string;
  timezone: string;
  email_verified: boolean;
  avatar_url?: string | null;
  created_at: string;
}

export interface AuthResponse {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
}

export interface ContactClickRequest {
  channel: ContactChannel;
}
