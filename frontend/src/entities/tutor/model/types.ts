export type {
  City,
  Subject,
  ContactsMasked,
  ContactsRevealed,
  ContactLinks,
  TutorPrice,
  TutorPublic,
  Pagination,
  TutorListResponse as TutorsListResponse,
} from '@/shared/types';

import type {
  AgeGroup,
  Goal,
  LessonFormat,
  TeachingLanguage,
} from '@/shared/config/constants';
import type { Subject, TutorPublic } from '@/shared/types';

export interface TutorLanguageEntry {
  language_code: TeachingLanguage;
  level?: 'native' | 'fluent' | 'b2' | 'c1' | 'c2' | string;
}

export interface Education {
  id: string;
  institution: string;
  specialty?: string | null;
  year_start?: number | null;
  year_end?: number | null;
}

export interface WorkExperience {
  id: string;
  position: string;
  company?: string | null;
  year_start?: number | null;
  year_end?: number | null;
}

export interface TutorDocument {
  id: string;
  title?: string | null;
  file_url: string;
  file_type?: string | null;
  verified: boolean;
}

export interface TutorFull extends TutorPublic {
  subjects: Subject[];
  goals: string[];
  age_groups: string[];
  formats: string[];
  languages: TutorLanguageEntry[];
  education: Education[];
  experience: WorkExperience[];
  documents: TutorDocument[];
}

export interface CatalogFilters {
  subject?: string;
  goal?: Goal;
  format?: LessonFormat;
  city?: string;
  price_min?: number;
  price_max?: number;
  experience_min?: number;
  age_group?: AgeGroup;
  language?: TeachingLanguage;
  is_native?: boolean;
  q?: string;
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'experience' | 'new';
  page?: number;
  limit?: number;
}
