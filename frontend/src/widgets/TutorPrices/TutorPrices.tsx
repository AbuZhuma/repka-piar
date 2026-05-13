'use client';

import { useLocale, useTranslations } from 'next-intl';

import type { TutorFull } from '@/entities/tutor/model/types';
import { cn } from '@/shared/lib/cn';
import { formatPrice } from '@/shared/lib/format';

import styles from './TutorPrices.module.scss';

interface TutorPricesProps {
  tutor: TutorFull;
}

export function TutorPrices({ tutor }: TutorPricesProps) {
  const t = useTranslations('tutor_profile');
  const locale = useLocale();
  const { price } = tutor;

  if (price.per_60 == null && price.per_90 == null && !price.trial_enabled) return null;

  return (
    <section id="prices" className={styles.section}>
      <h2 className={styles.heading}>{t('tabs.prices')}</h2>
      <ul className={styles.list}>
        {price.per_60 != null && (
          <li className={styles.row}>
            <span>{t('lesson_60')}</span>
            <span className={styles.value}>
              {formatPrice(price.per_60, price.currency, locale)}
            </span>
          </li>
        )}
        {price.per_90 != null && (
          <li className={styles.row}>
            <span>{t('lesson_90')}</span>
            <span className={styles.value}>
              {formatPrice(price.per_90, price.currency, locale)}
            </span>
          </li>
        )}
        {price.trial_enabled && (
          <li className={cn(styles.row, styles.trial)}>
            <span>{t('lesson_trial')}</span>
            <span className={styles.free}>{t('lesson_trial_free')}</span>
          </li>
        )}
      </ul>
      <p className={styles.disclaimer}>{t('prices_disclaimer')}</p>
    </section>
  );
}
