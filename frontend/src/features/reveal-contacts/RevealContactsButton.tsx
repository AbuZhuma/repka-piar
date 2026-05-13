'use client';

import { Instagram, Mail, MessageCircle, Phone, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/shared/ui/Button';
import type { ContactsMasked } from '@/shared/types';

import styles from './RevealContactsButton.module.scss';
import { useRevealContacts } from './useRevealContacts';

interface RevealContactsButtonProps {
  slug: string;
  contactsMasked: ContactsMasked;
}

export function RevealContactsButton({ slug, contactsMasked }: RevealContactsButtonProps) {
  const t = useTranslations('tutor_contacts');
  const { loading, error, reveal } = useRevealContacts(slug);

  return (
    <div className={styles.wrap}>
      <ul className={styles.previewList}>
        {contactsMasked.phone && (
          <li className={styles.previewRow}>
            <Phone size={18} />
            <span className={styles.masked}>{contactsMasked.phone}</span>
          </li>
        )}
        {contactsMasked.whatsapp && (
          <li className={styles.previewRow}>
            <MessageCircle size={18} />
            <span className={styles.masked}>WhatsApp</span>
          </li>
        )}
        {contactsMasked.telegram && (
          <li className={styles.previewRow}>
            <Send size={18} />
            <span className={styles.masked}>Telegram</span>
          </li>
        )}
        {contactsMasked.email && (
          <li className={styles.previewRow}>
            <Mail size={18} />
            <span className={styles.masked}>{contactsMasked.email}</span>
          </li>
        )}
        {contactsMasked.instagram && (
          <li className={styles.previewRow}>
            <Instagram size={18} />
            <span className={styles.masked}>Instagram</span>
          </li>
        )}
      </ul>

      <Button variant="primary" size="lg" fullWidth loading={loading} onClick={() => reveal()}>
        {t('show_button')}
      </Button>

      {error ? (
        <p className={styles.error}>{error}</p>
      ) : (
        <p className={styles.hint}>{t('hint_protected')}</p>
      )}
    </div>
  );    
}
