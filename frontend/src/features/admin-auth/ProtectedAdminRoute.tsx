'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';

import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/features/auth';

interface Props {
  children: ReactNode;
}

export function ProtectedAdminRoute({ children }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const isAdmin = Boolean(user?.roles?.includes('admin'));

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/admin/login');
      return;
    }
    if (!isAdmin) {
      router.push('/');
    }
  }, [loading, user, isAdmin, router]);

  if (loading || !user || !isAdmin) {
    return (
      <div style={{ padding: 64, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
        Загрузка...
      </div>
    );
  }
  return <>{children}</>;
}
