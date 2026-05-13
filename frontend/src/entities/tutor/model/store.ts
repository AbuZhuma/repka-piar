'use client';

import { create } from 'zustand';

import type { ContactLinks, ContactsRevealed } from '@/shared/types';

export interface RevealedEntry {
  contacts: ContactsRevealed;
  links: ContactLinks;
}

interface RevealedContactsState {
  revealed: Record<string, RevealedEntry>;
  setRevealed: (slug: string, entry: RevealedEntry) => void;
  isRevealed: (slug: string) => boolean;
  getRevealed: (slug: string) => RevealedEntry | null;
}

export const useRevealedContacts = create<RevealedContactsState>((set, get) => ({
  revealed: {},
  setRevealed: (slug, entry) =>
    set((state) => ({ revealed: { ...state.revealed, [slug]: entry } })),
  isRevealed: (slug) => slug in get().revealed,
  getRevealed: (slug) => get().revealed[slug] ?? null,
}));
