'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

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
  useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [mobileOpen]);

  return (
    <div className={styles.layout}>
      <CabinetHeader onMenuClick={() => setMobileOpen(true)} />
      <div className={styles.body}>
        <CabinetSidebar
          tutorSlug={tutorSlug}
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
