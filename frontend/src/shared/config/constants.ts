export const GOALS = [
  'school',
  'exam_ort',
  'exam_ege',
  'exam_ielts',
  'exam_toefl',
  'exam_sat',
  'olympiad',
  'beginner',
  'improve_grades',
  'self',
  'business',
  'other',
] as const;
export type Goal = (typeof GOALS)[number];

export const AGE_GROUPS = ['preschool', 'primary', 'middle', 'high', 'student', 'adult'] as const;
export type AgeGroup = (typeof AGE_GROUPS)[number];

export const FORMATS = ['online', 'at_tutor', 'at_student'] as const;
export type LessonFormat = (typeof FORMATS)[number];

export const TEACHING_LANGUAGES = ['ru', 'kg', 'en'] as const;
export type TeachingLanguage = (typeof TEACHING_LANGUAGES)[number];

export const BADGES = [
  'top',
  'native',
  'exam_ort',
  'exam_ielts',
  'exam_toefl',
  'exam_sat',
  'new',
] as const;
export type Badge = (typeof BADGES)[number];

export const CONTACT_CHANNELS = ['phone', 'whatsapp', 'telegram', 'email', 'instagram'] as const;
export type ContactChannel = (typeof CONTACT_CHANNELS)[number];
