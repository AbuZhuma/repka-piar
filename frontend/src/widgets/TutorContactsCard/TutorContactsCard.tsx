'use client';

import { Clock, MapPin, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';

import { useRevealedContacts } from '@/entities/tutor';
import type { TutorFull } from '@/entities/tutor/model/types';
import { ContactsList, RevealContactsButton } from '@/features/reveal-contacts';
import { assetUrl, formatPrice } from '@/shared/lib/format';

import styles from './TutorContactsCard.module.scss';

interface TutorContactsCardProps {
  tutor: TutorFull;
}

export function TutorContactsCard({ tutor }: TutorContactsCardProps) {
  const t = useTranslations('tutor_contacts');
  const tCard = useTranslations('tutor_card');
  const locale = useLocale();
  const entry = useRevealedContacts((s) => s.getRevealed(tutor.slug));
  const fullName = `${tutor.name} ${tutor.surname}`.trim();

  return (
    <aside className={styles.card}>
      <header className={styles.header}>
        {tutor.photo_url ? (
          <Image
            src={assetUrl(tutor.photo_url) ?? tutor.photo_url}
            alt={fullName}
            width={56}
            height={56}
            className={styles.avatar}
            unoptimized
          />
        ) : (
          <span className={styles.avatarFallback} aria-hidden>
            {tutor.name.slice(0, 1)}
          </span>
        )}
        <div className={styles.headerInfo}>
          <h3 className={styles.name}>{fullName}</h3>
          {typeof tutor.rating === 'number' && (
            <p className={styles.rating}>
              ★ {tutor.rating.toFixed(1)} · {tutor.experience_years} лет
            </p>
          )}
        </div>
      </header>

      {tutor.price.per_60 != null && (
        <div className={styles.priceBlock}>
          <span className={styles.priceLabel}>{t('price_label')}</span>
          <span className={styles.priceValue}>
            {tCard('price_from', {
              price: formatPrice(tutor.price.per_60, tutor.price.currency, locale),
            })}
          </span>
        </div>
      )}

      <div className={styles.contacts}>
        {entry ? (
          <ContactsList slug={tutor.slug} contacts={entry.contacts} links={entry.links} />
        ) : (
          <RevealContactsButton slug={tutor.slug} contactsMasked={tutor.contacts_masked} />
        )}
      </div>

      {tutor.city && (
        <p className={styles.meta}>
          <MapPin size={14} /> {tutor.city.name_ru}
          {tutor.address ? `, ${tutor.address}` : ''}
        </p>
      )}

      {tutor.schedule_text && (
        <p className={styles.meta}>
          <Clock size={14} /> {t('schedule_label')}: {tutor.schedule_text}
        </p>
      )}

      <p className={styles.trust}>
        <ShieldCheck size={14} /> {t('trust_docs')}
      </p>
    </aside>
  );
}
