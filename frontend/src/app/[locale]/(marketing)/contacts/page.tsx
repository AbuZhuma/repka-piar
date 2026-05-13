import { Mail, MessageCircle, Phone, Send } from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { ContactsForm } from '@/widgets/ContactsForm';
import { Container } from '@/shared/ui/Container';

import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Контакты',
  description: 'Связаться с командой Repka — поддержка, пресса, юристы.',
};

export default async function ContactsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <section className={styles.section}>
      <Container>
        <header className={styles.header}>
          <h1 className={styles.title}>Контакты</h1>
          <p className={styles.subtitle}>
            Напишите нам — отвечаем в течение 24 часов в рабочие дни.
          </p>
        </header>

        <div className={styles.layout}>
          <aside className={styles.info}>
            <div className={styles.infoBlock}>
              <h3 className={styles.blockTitle}>Email</h3>
              <ul className={styles.list}>
                <li>
                  <Mail size={16} />
                  <a href="mailto:support@repka.kg">support@repka.kg</a>
                  <span className={styles.muted}>— общая поддержка</span>
                </li>
                <li>
                  <Mail size={16} />
                  <a href="mailto:press@repka.kg">press@repka.kg</a>
                  <span className={styles.muted}>— пресса и медиа</span>
                </li>
                <li>
                  <Mail size={16} />
                  <a href="mailto:legal@repka.kg">legal@repka.kg</a>
                  <span className={styles.muted}>— юридические вопросы</span>
                </li>
              </ul>
            </div>

            <div className={styles.infoBlock}>
              <h3 className={styles.blockTitle}>Мессенджеры</h3>
              <ul className={styles.list}>
                <li>
                  <Send size={16} />
                  <a href="https://t.me/repka_kg" target="_blank" rel="noreferrer">
                    Telegram: @repka_kg
                  </a>
                </li>
                <li>
                  <MessageCircle size={16} />
                  <a
                    href="https://wa.me/996555000000"
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp: +996 555 000 000
                  </a>
                </li>
                <li>
                  <Phone size={16} />
                  <a href="tel:+996555000000">+996 555 000 000</a>
                </li>
              </ul>
            </div>

            <div className={styles.infoBlock}>
              <h3 className={styles.blockTitle}>Часы работы</h3>
              <p className={styles.text}>
                Пн–Пт: 9:00 — 19:00 (GMT+6)
                <br />
                Сб–Вс: только email и Telegram
              </p>
            </div>

            <div className={styles.infoBlock}>
              <h3 className={styles.blockTitle}>Офис</h3>
              <p className={styles.text}>
                г. Бишкек, Кыргызская Республика
                <br />
                <span className={styles.muted}>
                  Точный адрес — по запросу через email
                </span>
              </p>
            </div>
          </aside>

          <div className={styles.formWrap}>
            <ContactsForm />
          </div>
        </div>
      </Container>
    </section>
  );
}
