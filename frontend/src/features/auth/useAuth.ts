'use client';

import { useEffect } from 'react';
import { create } from 'zustand';

import { auth } from '@/shared/lib/auth';
import type { AuthUser } from '@/shared/types';

import { getMe, logoutUser } from './api';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  hydrated: boolean;
  setUser: (user: AuthUser | null) => void;
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  hydrated: false,
  setUser: (user) => set({ user }),
  hydrate: async () => {
    if (get().hydrated) return;
    set({ loading: true, hydrated: true });
    const token = auth.getAccess();
    if (!token) {
      set({ loading: false, user: null });
      return;
    }
    try {
      const user = await getMe();
      set({ user, loading: false });
    } catch {
      auth.clear();
      set({ user: null, loading: false });
    }
  },
  logout: async () => {
    const refresh = auth.getRefresh();
    if (refresh) {
      try {
        await logoutUser(refresh);
      } catch {
        // ignore network errors
      }
    }
    auth.clear();
    set({ user: null });
  },
}));

export function useAuth() {
  const state = useAuthStore();
  useEffect(() => {
    if (!state.hydrated) {
      void state.hydrate();
    }
  }, [state]);
  return {
    user: state.user,
    loading: state.loading,
    isAuthenticated: Boolean(state.user),
    setUser: state.setUser,
    logout: state.logout,
  };
}
