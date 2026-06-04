'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface EducationEntry {
  institution: string;
  specialty?: string;
  yearStart?: number;
  yearEnd?: number;
}

export interface LanguageEntry {
  code: string;
  level?: string;
}

export interface DocumentEntry {
  id?: string;
  title?: string;
  fileUrl: string;
}

export interface RegistrationData {
  // Step 1
  email: string;
  phone: string;
  password: string;
  name: string;
  surname: string;
  agreeTerms: boolean;

  // Step 2
  birthDate?: string;
  gender?: 'male' | 'female';
  cityId?: string;
  shortBio?: string;
  photoUrl?: string;

  // Step 3
  education: EducationEntry[];

  // Step 4
  experienceYears: number;
  subjectIds: string[];
  goals: string[];
  ageGroups: string[];
  languages: LanguageEntry[];
  isNativeSpeaker: boolean;

  // Step 5
  documents: DocumentEntry[];

  // Step 6
  videoUrl?: string;

  // Step 7
  pricePer60?: number;
  pricePer90?: number;
  trialEnabled: boolean;
  formats: string[];
  address?: string;
  studentDistricts: string[];

  // Step 8
  contactPhone: string;
  contactWhatsapp?: string;
  contactTelegram?: string;
  contactEmail?: string;
  contactInstagram?: string;

  // Step 9
  scheduleText?: string;
  description?: string;

  // Meta
  currentStep: number;
}

const DEFAULTS: RegistrationData = {
  email: '',
  phone: '',
  password: '',
  name: '',
  surname: '',
  agreeTerms: false,

  education: [],

  experienceYears: 0,
  subjectIds: [],
  goals: [],
  ageGroups: [],
  languages: [],
  isNativeSpeaker: false,

  documents: [],

  trialEnabled: false,
  formats: [],
  studentDistricts: [],

  contactPhone: '',

  currentStep: 1,
};

interface Actions {
  update: (data: Partial<RegistrationData>) => void;
  setStep: (step: number) => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
}

export const TOTAL_STEPS = 10;

export const useRegistrationStore = create<RegistrationData & Actions>()(
  persist(
    (set, get) => ({
      ...DEFAULTS,
      update: (data) => set((state) => ({ ...state, ...data })),
      setStep: (step) => set({ currentStep: Math.min(Math.max(step, 1), TOTAL_STEPS) }),
      next: () => {
        const cur = get().currentStep;
        set({ currentStep: Math.min(cur + 1, TOTAL_STEPS) });
      },
      prev: () => {
        const cur = get().currentStep;
        set({ currentStep: Math.max(cur - 1, 1) });
      },
      reset: () => set({ ...DEFAULTS }),
    }),
    {
      name: 'repka-tutor-registration',
      partialize: (state) => {
        // Don't persist sensitive/session-only fields (passwords, blob: URLs)
        const { password, videoUrl, ...rest } = state;
        void password;
        void videoUrl;
        return rest;
      },
    },
  ),
);
