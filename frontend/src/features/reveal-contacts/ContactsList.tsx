'use client';

import { Instagram, Mail, MessageCircle, Phone, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { logContactClick } from '@/entities/tutor';
import { ContactLink } from '@/features/contact-link';
import type { ContactChannel } from '@/shared/config/constants';
import type { ContactLinks, ContactsRevealed } from '@/shared/types';

import styles from './ContactsList.module.scss';

interface ContactsListProps {
  slug: string;
  contacts: ContactsRevealed;
  links: ContactLinks;
}

export function ContactsList({ slug, contacts, links }: ContactsListProps) {
  const t = useTranslations('tutor_contacts.channels');

  const open = (channel: ContactChannel, url: string | null | undefined) => {
    if (!url) return;
    void logContactClick(slug, channel).catch((err) => console.error('contact-click log', err));
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={styles.list}>
      {contacts.phone && (
        <ContactLink
          icon={<Phone />}
          variant="primary"
          label={t('phone')}
          value={contacts.phone}
          onClick={() => open('phone', links.phone_tel)}
        />
      )}
      {contacts.whatsapp && (
        <ContactLink
          icon={<MessageCircle />}
          variant="whatsapp"
          label={t('whatsapp')}
          value={contacts.whatsapp}
          onClick={() => open('whatsapp', links.whatsapp_url)}
        />
      )}
      {contacts.telegram && (
        <ContactLink
          icon={<Send />}
          variant="telegram"
          label={t('telegram')}
          value={`@${contacts.telegram.replace(/^@/, '')}`}
          onClick={() => open('telegram', links.telegram_url)}
        />
      )}
      {contacts.email && (
        <ContactLink
          icon={<Mail />}
          variant="email"
          label={t('email')}
          value={contacts.email}
          onClick={() => open('email', links.email_mailto)}
        />
      )}
      {contacts.instagram && (
        <ContactLink
          icon={<Instagram />}
          variant="instagram"
          label={t('instagram')}
          value={`@${contacts.instagram.replace(/^@/, '')}`}
          onClick={() => open('instagram', links.instagram_url)}
        />
      )}
    </div>
  );
}
