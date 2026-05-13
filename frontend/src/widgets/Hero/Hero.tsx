import { useTranslations } from 'next-intl';

import { SearchBar } from '@/features/search-bar';
import { Link } from '@/i18n/routing';
import { Container } from '@/shared/ui/Container';
import type { Subject } from '@/shared/types';

import styles from './Hero.module.scss';

const QUICK_FILTERS: Array<{ label: string; href: string; key: string }> = [
  { key: 'english', label: 'Английский', href: '/catalog/english' },
  { key: 'math', label: 'Математика', href: '/catalog/math' },
  { key: 'ort', label: 'ОРТ', href: '/catalog/exam/ort' },
  { key: 'ielts', label: 'IELTS', href: '/catalog/exam/ielts' },
  { key: 'kyrgyz', label: 'Кыргыз тили', href: '/catalog/kyrgyz' },
  { key: 'preschool', label: 'Подготовка к школе', href: '/catalog/preschool' },
  { key: 'physics', label: 'Физика', href: '/catalog/physics' },
];

interface HeroProps {
  subjects: Subject[];
  totalTutors: number;
}

export function Hero({ subjects, totalTutors }: HeroProps) {
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
              <Link key={qf.key} href={qf.href} className={styles.chip}>
                {qf.label}
              </Link>
            ))}
          </div>
        </div>

        <div className={styles.trust}>
          {t('homepage.trust_strip', {
            tutors: Math.max(totalTutors, 30),
            rating: '4.9',
          })}
        </div>
      </Container>
    </section>
  );
}
