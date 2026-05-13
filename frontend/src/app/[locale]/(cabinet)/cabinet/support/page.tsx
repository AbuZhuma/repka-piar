'use client';

import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown, Clock, Mail, Phone, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useAuth } from '@/features/auth';
import { ContactsForm } from '@/widgets/ContactsForm';

import styles from './page.module.scss';

export default function CabinetSupportPage() {
  const t = useTranslations('cabinet.support');
  const { user } = useAuth();
  const faqItems = t.raw('faq_items') as Array<{ q: string; a: string }>;

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.subtitle}>{t('subtitle')}</p>
      </header>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>{t('faq_title')}</h2>
        <Accordion.Root type="single" collapsible className={styles.faq}>
          {faqItems.map((item, idx) => (
            <Accordion.Item key={idx} value={`q-${idx}`} className={styles.faqItem}>
              <Accordion.Header>
                <Accordion.Trigger className={styles.faqTrigger}>
                  <span>{item.q}</span>
                  <ChevronDown size={18} className={styles.faqChevron} />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className={styles.faqContent}>
                <p>{item.a}</p>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>{t('contacts_title')}</h2>
        <p className={styles.subtitle}>{t('contacts_subtitle')}</p>
        <ul className={styles.contacts}>
          <li className={styles.contact}>
            <span className={styles.contactIcon}>
              <Mail size={18} />
            </span>
            <span className={styles.contactBody}>
              <span className={styles.contactLabel}>{t('contact_email_label')}</span>
              <a href={`mailto:${t('contact_email_value')}`} className={styles.contactValue}>
                {t('contact_email_value')}
              </a>
            </span>
          </li>
          <li className={styles.contact}>
            <span className={styles.contactIcon}>
              <Send size={18} />
            </span>
            <span className={styles.contactBody}>
              <span className={styles.contactLabel}>{t('contact_telegram_label')}</span>
              <a
                href={`https://t.me/${t('contact_telegram_value').replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.contactValue}
              >
                {t('contact_telegram_value')}
              </a>
            </span>
          </li>
          <li className={styles.contact}>
            <span className={styles.contactIcon}>
              <Phone size={18} />
            </span>
            <span className={styles.contactBody}>
              <span className={styles.contactLabel}>{t('contact_phone_label')}</span>
              <a href={`tel:${t('contact_phone_value').replace(/\s/g, '')}`} className={styles.contactValue}>
                {t('contact_phone_value')}
              </a>
            </span>
          </li>
          <li className={styles.contact}>
            <span className={styles.contactIcon}>
              <Clock size={18} />
            </span>
            <span className={styles.contactBody}>
              <span className={styles.contactLabel}>{t('contact_hours_label')}</span>
              <span className={styles.contactValue}>{t('contact_hours_value')}</span>
            </span>
          </li>
        </ul>
      </section>

      <section>
        <ContactsForm
          title="Написать в поддержку"
          defaultTopic="tutor"
          defaultName={user ? `${user.name} ${user.surname}`.trim() : ''}
          defaultEmail={user?.email ?? ''}
          defaultPhone={user?.phone ?? ''}
        />
      </section>
    </div>
  );
}
