'use client';

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

import type { MyTutorProfile } from '@/features/cabinet-analytics';

interface EditorContextValue {
  profile: MyTutorProfile;
  setProfile: (next: MyTutorProfile | ((prev: MyTutorProfile) => MyTutorProfile)) => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function ProfileEditorProvider({
  initial,
  children,
}: {
  initial: MyTutorProfile;
  children: ReactNode;
}) {
  const [profile, setProfile] = useState<MyTutorProfile>(initial);
  return (
    <EditorContext.Provider value={{ profile, setProfile }}>{children}</EditorContext.Provider>
  );
}

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used within ProfileEditorProvider');
  return ctx;
}
