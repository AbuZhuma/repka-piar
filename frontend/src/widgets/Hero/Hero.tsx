import { useTranslations } from 'next-intl';

import { SearchBar } from '@/features/search-bar';
import { Link } from '@/i18n/routing';
import { ROUTES } from '@/shared/config/routes';
import { Container } from '@/shared/ui/Container';
import type { Subject } from '@/shared/types';

import styles from './Hero.module.scss';

const QUICK_FILTERS: Array<{ label: string; href: string; key: string }> = [
  { key: 'english', label: 'Английский', href: ROUTES.catalogBy({ subject: 'english' }) },
  { key: 'math', label: 'Математика', href: ROUTES.catalogBy({ subject: 'math' }) },
  { key: 'ort', label: 'ОРТ', href: ROUTES.catalogBy({ goal: 'exam_ort' }) },
  { key: 'ielts', label: 'IELTS', href: ROUTES.catalogBy({ goal: 'exam_ielts' }) },
  { key: 'kyrgyz', label: 'Кыргыз тили', href: ROUTES.catalogBy({ subject: 'kyrgyz' }) },
  { key: 'preschool', label: 'Подготовка к школе', href: ROUTES.catalogBy({ goal: 'school_prep' }) },
  { key: 'physics', label: 'Физика', href: ROUTES.catalogBy({ subject: 'physics' }) },
];

interface HeroProps {
  subjects: Subject[];
  totalTutors: number;
  citiesCount?: number;
}

export function Hero({ subjects, totalTutors, citiesCount }: HeroProps) {
  const t = useTranslations();

  return (
    <section className={styles.hero}>
      <Container className={styles.container}>
        <div className={styles.intro}>
          <h1 className={styles.heading}>{t('homepage.h1')}</h1>
          <p className={styles.subtitle}>{t('homepage.subtitle')}</p>
        </div>

        <SearchBar subjects={subjects} />

        <div className={styles.quick}>
          <span className={styles.quickLabel}>{t('homepage.quick_filters_title')}</span>
          <div className={styles.quickList}>
            {QUICK_FILTERS.map((qf) => (
              <Link key={qf.key} href={qf.href}   className={styles.chip}>
                {qf.label}
              </Link>
            ))}
          </div>
        </div>

        <div className={styles.trust}>
          {t('homepage.trust_strip', {
            tutors: totalTutors,
            cities: citiesCount ?? 10,
          })}
        </div>
      </Container>
    </section>
  );
}
