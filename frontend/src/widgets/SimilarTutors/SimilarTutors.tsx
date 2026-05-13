import { useTranslations } from 'next-intl';

import { TutorCard } from '@/entities/tutor';
import type { TutorPublic } from '@/entities/tutor/model/types';

import styles from './SimilarTutors.module.scss';

interface SimilarTutorsProps {
  tutors: TutorPublic[];
}

export function SimilarTutors({ tutors }: SimilarTutorsProps) {
  const t = useTranslations('tutor_profile');
  if (tutors.length === 0) return null;
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>{t('similar_title')}</h2>
      <div className={styles.carousel}>
        {tutors.map((tutor) => (
          <div key={tutor.id} className={styles.cell}>
            <TutorCard tutor={tutor} />
          </div>
        ))}
      </div>
    </section>
  );
}
