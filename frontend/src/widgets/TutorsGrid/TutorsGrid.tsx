import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { TutorCard } from '@/entities/tutor';
import type { TutorPublic } from '@/entities/tutor/model/types';
import { Link } from '@/i18n/routing';
import { cn } from '@/shared/lib/cn';
import { Container } from '@/shared/ui/Container';

import styles from './TutorsGrid.module.scss';

interface TutorsGridProps {
  tutors: TutorPublic[];
  title?: string;
  showAllLink?: boolean;
  withContainer?: boolean;
  emptyState?: ReactNode;
  className?: string;
  variant?: 'home' | 'catalog';
}

export function TutorsGrid({
  tutors,
  title,
  showAllLink = false,
  withContainer = true,
  emptyState,
  className,
  variant = 'home',
}: TutorsGridProps) {
  const t = useTranslations();

  const grid = (
    <>
      {(title || showAllLink) && (
        <header className={styles.header}>
          {title && <h2 className={styles.title}>{title}</h2>}
          {showAllLink && (
            <Link href="/catalog" className={styles.allLink}>
              {t('common.all_filters')} <ChevronRight size={16} />
            </Link>
          )}
        </header>
      )}
      {tutors.length === 0 ? (
        emptyState ?? <p className={styles.empty}>{t('common.no_results')}</p>
      ) : (
        <div className={cn(styles.grid, styles[`variant_${variant}`])}>
          {tutors.map((tutor) => (
            <TutorCard key={tutor.id} tutor={tutor} />
          ))}
        </div>
      )}
    </>
  );

  if (!withContainer) {
    return <div className={className}>{grid}</div>;
  }

  return (
    <section className={`${styles.section} ${className ?? ''}`}>
      <Container>{grid}</Container>
    </section>
  );
}
