'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FavoriteTutor {
  id: string;
  slug: string;
  name: string;
  surname: string;
  photo_url: string | null;
  price_per_60: number | null;
  currency: string;
  specializations: string[];
  rating: number | null;
  reviews_count: number;
  trial_enabled: boolean;
  added_at: number;
}

interface FavoritesState {
  items: FavoriteTutor[];
  add: (tutor: FavoriteTutor) => void;
  remove: (id: string) => void;
  toggle: (tutor: FavoriteTutor) => void;
  clear: () => void;
  has: (id: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (tutor) =>
        set((s) =>
          s.items.some((t) => t.id === tutor.id)
            ? s
            : { items: [{ ...tutor, added_at: Date.now() }, ...s.items] },
        ),
      remove: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
      toggle: (tutor) =>
        set((s) =>
          s.items.some((t) => t.id === tutor.id)
            ? { items: s.items.filter((t) => t.id !== tutor.id) }
            : { items: [{ ...tutor, added_at: Date.now() }, ...s.items] },
        ),
      clear: () => set({ items: [] }),
      has: (id) => get().items.some((t) => t.id === id),
    }),
    { name: 'repka-favorite-tutors' },
  ),
);
