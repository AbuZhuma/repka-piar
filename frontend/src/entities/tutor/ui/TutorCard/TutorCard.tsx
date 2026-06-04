import { BadgeCheck, Gift, Play, Star } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';

import { FavoriteButton } from '@/features/favorites';
import { Link } from '@/i18n/routing';
import { ROUTES } from '@/shared/config/routes';
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
      <div className={styles.favorite}>
        <FavoriteButton
          size="sm"
          tutor={{
            id: tutor.id,
            slug: tutor.slug,
            name: tutor.name,
            surname: tutor.surname,
            photo_url: tutor.photo_url,
            price_per_60: tutor.price.per_60,
            currency: tutor.price.currency,
            specializations: tutor.specializations,
            rating: tutor.rating,
            reviews_count: tutor.reviews_count,
            trial_enabled: tutor.price.trial_enabled,
          }}
        />
      </div>
      <Link href={ROUTES.tutor(tutor.slug)} className={styles.link} aria-label={fullName}>
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

          <div className={styles.photoBadges}>
            {tutor.price.trial_enabled && (
              <span
                className={`${styles.photoBadge} ${styles.photoBadgeTrial}`}
                title={t('tutor_card.trial_badge')}
              >
                <Gift size={12} />
                <span>{t('tutor_card.trial_badge')}</span>
              </span>
            )}
            {tutor.verified && (
              <span
                className={`${styles.photoBadge} ${styles.photoBadgeVerified}`}
                title={t('tutor_card.verified')}
              >
                <BadgeCheck size={12} />
              </span>
            )}
          </div>

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

          {typeof tutor.rating === 'number' && (
            <div className={styles.meta}>
              <span className={styles.rating}>
                <Star size={14} fill="currentColor" />
                {tutor.rating.toFixed(1)}
                {tutor.reviews_count > 0 && (
                  <span className={styles.reviews}> ({tutor.reviews_count})</span>
                )}
              </span>
            </div>
          )}

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
