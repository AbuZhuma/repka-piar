'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { Button } from '@/shared/ui/Button';

import styles from './StepShell.module.scss';
import { useRegistrationStore } from './useRegistrationStore';

interface StepShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onNext?: () => void | Promise<void>;
  nextLabel?: string;
  loading?: boolean;
  error?: string | null;
  hideBack?: boolean;
  hideNext?: boolean;
  showSkip?: boolean;
  skipLabel?: string;
  onSkip?: () => void;
}

export function StepShell({
  title,
  subtitle,
  children,
  onNext,
  nextLabel,
  loading,
  error,
  hideBack,
  hideNext,
  showSkip,
  skipLabel,
  onSkip,
}: StepShellProps) {
  const t = useTranslations('register');
  const prev = useRegistrationStore((s) => s.prev);

  return (
    <section className={styles.shell}>
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </header>

      <div className={styles.body}>{children}</div>

      {error && <p className={styles.error}>{error}</p>}

      <footer className={styles.footer}>
        {!hideBack && (
          <Button variant="ghost" size="md" type="button" onClick={prev} disabled={loading}>
            {t('back')}
          </Button>
        )}
        <div className={styles.spacer} />
        {showSkip && (
          <Button variant="ghost" size="md" type="button" onClick={onSkip} disabled={loading}>
            {skipLabel ?? t('skip')}
          </Button>
        )}
        {!hideNext && (
          <Button
            variant="primary"
            size="md"
            type="button"
            onClick={() => {
              void onNext?.();
            }}
            loading={loading}
          >
            {nextLabel ?? t('next')}
          </Button>
        )}
      </footer>
    </section>
  );
}
