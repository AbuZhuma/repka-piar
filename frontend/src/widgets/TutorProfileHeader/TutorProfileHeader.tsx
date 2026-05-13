'use client';

import { Play, Star } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { TutorBadges } from '@/entities/tutor';
import type { TutorFull } from '@/entities/tutor/model/types';
import { assetUrl } from '@/shared/lib/format';

import styles from './TutorProfileHeader.module.scss';

interface TutorProfileHeaderProps {
  tutor: TutorFull;
  onOpenVideo?: () => void;
}

export function TutorProfileHeader({ tutor, onOpenVideo }: TutorProfileHeaderProps) {
  const t = useTranslations('tutor_profile');
  const fullName = `${tutor.name} ${tutor.surname}`.trim();
  const primarySubject = tutor.subjects[0];
  const specialization = tutor.specializations[0];

  return (
    <header className={styles.header}>
      <div className={styles.photoColumn}>
        {tutor.photo_url ? (
          <Image
            src={assetUrl(tutor.photo_url) ?? tutor.photo_url}
            alt={fullName}
            width={400}
            height={400}
            className={styles.photo}
            priority
            unoptimized
          />
        ) : (
          <div className={styles.photoFallback} aria-hidden>
            {tutor.name.slice(0, 1)}
          </div>
        )}
        {tutor.video_url && (
          <button type="button" className={styles.videoButton} onClick={onOpenVideo}>
            <Play size={16} fill="currentColor" />
            <span>{t('sections.video')}</span>
          </button>
        )}
      </div>

      <div className={styles.info}>
        <h1 className={styles.name}>{fullName}</h1>
        {primarySubject && (
          <p className={styles.subtitle}>
            {t('subtitle', {
              subject: specialization
                ? `${primarySubject.name_ru.toLowerCase()}, ${specialization.toLowerCase()}`
                : primarySubject.name_ru.toLowerCase(),
            })}
          </p>
        )}

        {tutor.badges.length > 0 && (
          <div className={styles.badgesRow}>
            <TutorBadges badges={tutor.badges} max={4} />
          </div>
        )}

        <ul className={styles.meta}>
          {typeof tutor.rating === 'number' && (
            <li className={styles.rating}>
              <Star size={14} fill="currentColor" />
              {tutor.rating.toFixed(1)}
              {tutor.reviews_count > 0 && (
                <span className={styles.reviews}> ({tutor.reviews_count})</span>
              )}
            </li>
          )}
          <li>{t('experience_label', { years: tutor.experience_years })}</li>
          {tutor.subjects.length > 0 && (
            <li>{t('subjects_count', { count: tutor.subjects.length })}</li>
          )}
        </ul>
      </div>
    </header>
  );
}
