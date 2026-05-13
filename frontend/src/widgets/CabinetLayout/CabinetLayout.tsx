'use client';

import type { ReactNode } from 'react';

import { ProtectedRoute, useAuth } from '@/features/auth';
import { CabinetHeader } from '@/widgets/CabinetHeader';
import { CabinetSidebar } from '@/widgets/CabinetSidebar';

import styles from './CabinetLayout.module.scss';

interface CabinetLayoutProps {
  children: ReactNode;
  tutorSlug?: string | null;
}

export function CabinetLayout({ children, tutorSlug }: CabinetLayoutProps) {
  return (
    <ProtectedRoute>
      <CabinetShell tutorSlug={tutorSlug}>{children}</CabinetShell>
    </ProtectedRoute>
  );
}

function CabinetShell({ children, tutorSlug }: CabinetLayoutProps) {
  // Hook to ensure auth state is loaded; child pages may also use it
  useAuth();
  return (
    <div className={styles.layout}>
      <CabinetHeader />
      <div className={styles.body}>
        <CabinetSidebar tutorSlug={tutorSlug} />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
