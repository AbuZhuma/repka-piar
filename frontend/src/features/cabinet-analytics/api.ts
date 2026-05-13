import { apiGet } from '@/shared/lib/api';

export interface MetricBlock {
  total: number;
  current_period: number;
  previous_period: number;
  change_percent: number | null;
}

export interface ConversionBlock {
  current_period: number;
  previous_period: number;
  change_percent: number | null;
}

export interface CurrentPosition {
  subject: string | null;
  city: string | null;
  rank: number | null;
  total: number;
}

export interface OverviewResponse {
  views: MetricBlock;
  contact_clicks: MetricBlock;
  conversion: ConversionBlock;
  current_position: CurrentPosition;
}

export interface DayCount {
  date: string;
  count: number;
}

export interface ChannelStat {
  channel: string;
  count: number;
  percent: number;
}

export interface SourceStat {
  source: string;
  count: number;
  percent: number;
}

export interface AnalyticsEvent {
  type: string;
  message: string;
  timestamp: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface ProfileCompleteness {
  percent: number;
  checklist: ChecklistItem[];
}

export interface DashboardResponse {
  overview: OverviewResponse;
  views_chart: DayCount[];
  contacts_by_channel: ChannelStat[];
  sources: SourceStat[];
  recent_events: AnalyticsEvent[];
  verification_status: string;
  rejection_reason: string | null;
  profile_completeness: ProfileCompleteness;
}

export async function getDashboard(): Promise<DashboardResponse> {
  return apiGet<DashboardResponse>('/api/tutors/me/dashboard');
}

export interface MyTutorProfile {
  id: string;
  user_id: string;
  slug: string;
  bio: string | null;
  short_bio: string | null;
  photo_url: string | null;
  video_url: string | null;
  is_native_speaker: boolean;
  experience_years: number;
  specializations: string[];
  city_id: string | null;
  address: string | null;
  student_districts: string[] | null;
  schedule_text: string | null;
  price_per_60: number | null;
  price_per_90: number | null;
  currency: string;
  trial_enabled: boolean;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  contact_telegram: string | null;
  contact_email: string | null;
  contact_instagram: string | null;
  status: string;
  verified: boolean;
  rejection_reason: string | null | undefined;
  badges: string[];
  views_count: number;
  contact_clicks_count: number;
  rating: number | null;
  reviews_count: number;
  created_at: string;
  updated_at: string;
  // From backend MyProfileFull
  name: string;
  surname: string;
  city: { id: string; slug: string; name_ru: string } | null;
  contacts: {
    phone: string | null;
    whatsapp: string | null;
    telegram: string | null;
    email: string | null;
    instagram: string | null;
  };
}

export async function getMyTutorProfile(): Promise<MyTutorProfile> {
  return apiGet<MyTutorProfile>('/api/tutors/me');
}
