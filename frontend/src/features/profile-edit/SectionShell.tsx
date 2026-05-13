'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { Button } from '@/shared/ui/Button';
import { cn } from '@/shared/lib/cn';

import styles from './SectionShell.module.scss';

interface SectionShellProps {
  id: string;
  title: string;
  children: ReactNode;
  onSave?: () => void | Promise<void>;
  loading?: boolean;
  saved?: boolean;
  error?: string | null;
  hideSave?: boolean;
}

export function SectionShell({
  id,
  title,
  children,
  onSave,
  loading,
  saved,
  error,
  hideSave,
}: SectionShellProps) {
  const t = useTranslations('cabinet.profile_edit');
  return (
    <section id={id} className={styles.section}>
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
      </header>
      <div className={styles.body}>{children}</div>
      {error && <p className={styles.error}>{error}</p>}
      {!hideSave && (
        <footer className={styles.footer}>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => void onSave?.()}
            loading={loading}
          >
            {loading ? t('saving') : t('save')}
          </Button>
          {saved && <span className={cn(styles.savedBadge)}>✓ {t('saved')}</span>}
        </footer>
      )}
    </section>
  );
}
