'use client';

import { Mail, MapPin, MessageCircle, Phone, Send, User } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { useEditor } from '@/widgets/ProfileEditor/EditorContext';
import { env } from '@/shared/config/env';
import { formatPrice } from '@/shared/lib/format';

import styles from './ProfilePreview.module.scss';

export function ProfilePreview() {
  const t = useTranslations('cabinet.profile_edit');
  const locale = useLocale();
  const { profile } = useEditor();
  const fullName = `${profile.name} ${profile.surname}`.trim();
  const photoSrc = profile.photo_url
    ? profile.photo_url.startsWith('http')
      ? profile.photo_url
      : `${env.apiUrl}${profile.photo_url}`
    : null;

  const hasContacts =
    profile.contact_phone || profile.contact_whatsapp || profile.contact_telegram;

  return (
    <aside className={styles.preview}>
      <h3 className={styles.title}>{t('preview_title')}</h3>
      <div className={styles.card}>
        <div className={styles.head}>
          {photoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoSrc} alt={fullName} className={styles.photo} />
          ) : (
            <div className={styles.photoFallback}>
              <User size={32} />
            </div>
          )}
          <div className={styles.headInfo}>
            <strong>{fullName}</strong>
            {profile.experience_years > 0 && (
              <span className={styles.muted}>{profile.experience_years} лет</span>
            )}
          </div>
        </div>

        {profile.short_bio && <p className={styles.short}>{profile.short_bio}</p>}

        {profile.specializations.length > 0 && (
          <ul className={styles.tags}>
            {profile.specializations.slice(0, 4).map((s) => (
              <li key={s} className={styles.tag}>
                {s}
              </li>
            ))}
          </ul>
        )}

        {profile.price_per_60 != null && (
          <div className={styles.priceRow}>
            <span className={styles.muted}>60 минут</span>
            <strong>{formatPrice(profile.price_per_60, profile.currency, locale)}</strong>
          </div>
        )}

        {profile.city?.name_ru && (
          <p className={styles.muted}>
            <MapPin size={14} /> {profile.city.name_ru}
          </p>
        )}

        <div className={styles.contacts}>
          {hasContacts ? (
            <>
              {profile.contact_phone && (
                <span className={styles.contact}>
                  <Phone size={14} /> {profile.contact_phone}
                </span>
              )}
              {profile.contact_whatsapp && (
                <span className={styles.contact}>
                  <MessageCircle size={14} /> WhatsApp
                </span>
              )}
              {profile.contact_telegram && (
                <span className={styles.contact}>
                  <Send size={14} /> {profile.contact_telegram}
                </span>
              )}
              {profile.contact_email && (
                <span className={styles.contact}>
                  <Mail size={14} /> {profile.contact_email}
                </span>
              )}
            </>
          ) : (
            <p className={styles.muted}>{t('preview_no_contacts')}</p>
          )}
        </div>

        <a
          href={`/tutor/${profile.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.openFull}
        >
          {t('open_full')}
        </a>
      </div>
    </aside>
  );
}
