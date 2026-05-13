'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';

import { useRouter } from '@/i18n/routing';

import { useAuth } from './useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ children, fallback, redirectTo = '/login' }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      const here =
        typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}`
          : '/';
      router.push(`${redirectTo}?redirect=${encodeURIComponent(here)}`);
    }
  }, [loading, user, redirectTo, router]);

  if (loading) {
    return (
      fallback ?? (
        <div style={{ padding: 64, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
          Загрузка...
        </div>
      )
    );
  }

  if (!user) return null;
  return <>{children}</>;
}
