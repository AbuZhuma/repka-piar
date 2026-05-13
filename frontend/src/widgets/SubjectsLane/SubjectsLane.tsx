import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/routing';
import { Container } from '@/shared/ui/Container';
import type { Subject } from '@/shared/types';

import styles from './SubjectsLane.module.scss';

interface SubjectsLaneProps {
  subjects: Subject[];
}

export function SubjectsLane({ subjects }: SubjectsLaneProps) {
  const t = useTranslations('homepage');
  return (
    <section className={styles.section}>
      <Container>
        <header className={styles.header}>
          <h2 className={styles.title}>{t('subjects_title')}</h2>
          <Link href="/catalog" className={styles.allLink}>
            {t('all_subjects')} <ChevronRight size={16} />
          </Link>
        </header>
        <div className={styles.lane} role="list">
          {subjects.map((s) => (
            <Link
              key={s.id}
              href={`/catalog?subject=${encodeURIComponent(s.slug)}`}
              className={styles.item}
              role="listitem"
            >
              <span className={styles.icon} aria-hidden>
                {s.icon ?? '📚'}
              </span>
              <span className={styles.name}>{s.name_ru}</span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
