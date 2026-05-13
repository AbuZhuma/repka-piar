import { Play, Star } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';

import { Link } from '@/i18n/routing';
import { assetUrl, formatPrice } from '@/shared/lib/format';

import { TutorBadges } from '../TutorBadges';

import styles from './TutorCard.module.scss';
import type { TutorPublic } from '../../model/types';

interface TutorCardProps {
  tutor: TutorPublic;
}

export function TutorCard({ tutor }: TutorCardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const fullName = `${tutor.name} ${tutor.surname}`.trim();

  return (
    <article className={styles.card}>
      <Link href={`/tutor/${tutor.slug}`} className={styles.link} aria-label={fullName}>
        <div className={styles.photoWrapper}>
          {tutor.photo_url ? (
            <Image
              src={assetUrl(tutor.photo_url) ?? tutor.photo_url}
              alt={fullName}
              width={300}
              height={300}
              className={styles.photo}
              unoptimized
            />
          ) : (
            <div className={styles.photoFallback} aria-hidden>
              {tutor.name.slice(0, 1)}
            </div>
          )}
          {tutor.video_url && (
            <span className={styles.videoIndicator} aria-label="video">
              <Play size={14} fill="currentColor" />
            </span>
          )}
        </div>

        <div className={styles.body}>
          {tutor.badges.length > 0 && <TutorBadges badges={tutor.badges} max={2} />}

          <h3 className={styles.name}>{fullName}</h3>

          {tutor.specializations.length > 0 ? (
            <p className={styles.specializations}>
              {tutor.specializations.slice(0, 2).join(' · ')}
            </p>
          ) : tutor.short_bio ? (
            <p className={styles.specializations}>{tutor.short_bio}</p>
          ) : null}

          <div className={styles.meta}>
            {typeof tutor.rating === 'number' && (
              <span className={styles.rating}>
                <Star size={14} fill="currentColor" />
                {tutor.rating.toFixed(1)}
                {tutor.reviews_count > 0 && (
                  <span className={styles.reviews}> ({tutor.reviews_count})</span>
                )}
              </span>
            )}
            <span className={styles.experience}>
              {t('tutor_card.experience_years', { years: tutor.experience_years })}
            </span>
          </div>

          <p className={styles.price}>
            {tutor.price.per_60 != null
              ? t('tutor_card.price_from', {
                  price: formatPrice(tutor.price.per_60, tutor.price.currency, locale),
                })
              : t('tutor_card.no_price')}
          </p>
        </div>
      </Link>
    </article>
  );
}
