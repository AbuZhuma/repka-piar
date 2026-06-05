'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  apiAddFavorite,
  apiListFavorites,
  apiRemoveFavorite,
  apiSyncFavorites,
  type ApiFavoriteTutor,
} from '@/shared/api/me';

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
  /** True after the store has reconciled with the server for the current user. */
  syncedFor: string | null;
  add: (tutor: FavoriteTutor) => void;
  remove: (id: string) => void;
  toggle: (tutor: FavoriteTutor) => void;
  clear: () => void;
  has: (id: string) => boolean;
  /**
   * Reconciles with the API after login: pushes any guest-saved favorites to
   * the server, then replaces local items with the server's list.
   *
   * Safe to call on every page navigation — does nothing if already synced
   * for the current user. Call again with null userId on logout to forget.
   */
  hydrateForUser: (userId: string | null) => Promise<void>;
}

function fromApi(t: ApiFavoriteTutor): FavoriteTutor {
  return {
    id: t.id,
    slug: t.slug,
    name: t.name,
    surname: t.surname,
    photo_url: t.photo_url,
    price_per_60: t.price_per_60,
    currency: t.currency,
    specializations: t.specializations,
    rating: t.rating,
    reviews_count: t.reviews_count,
    trial_enabled: t.trial_enabled,
    added_at: new Date(t.added_at).getTime(),
  };
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],
      syncedFor: null,

      add: (tutor) => {
        const entry: FavoriteTutor = { ...tutor, added_at: Date.now() };
        set((s) =>
          s.items.some((t) => t.id === entry.id) ? s : { items: [entry, ...s.items] },
        );
        if (get().syncedFor) {
          void apiAddFavorite(tutor.id).catch(() => {
            /* offline-ok */
          });
        }
      },

      remove: (id) => {
        set((s) => ({ items: s.items.filter((t) => t.id !== id) }));
        if (get().syncedFor) {
          void apiRemoveFavorite(id).catch(() => {
            /* offline-ok */
          });
        }
      },

      toggle: (tutor) => {
        const has = get().items.some((t) => t.id === tutor.id);
        if (has) get().remove(tutor.id);
        else get().add(tutor);
      },

      clear: () => set({ items: [] }),

      has: (id) => get().items.some((t) => t.id === id),

      hydrateForUser: async (userId) => {
        if (!userId) {
          // Logout — keep local items for the next guest session but mark unsynced.
          if (get().syncedFor !== null) set({ syncedFor: null });
          return;
        }
        if (get().syncedFor === userId) return; // already done this session
        try {
          const local = get().items;
          if (local.length > 0) {
            await apiSyncFavorites(local.map((t) => t.id));
          }
          const remote = await apiListFavorites();
          set({ items: remote.map(fromApi), syncedFor: userId });
        } catch {
          // Network blip — mark synced so we don't spin; user actions still
          // work locally and the next call will succeed.
          set({ syncedFor: userId });
        }
      },
    }),
    {
      name: 'repka-favorite-tutors',
      partialize: (s) => ({ items: s.items }),
    },
  ),
);
