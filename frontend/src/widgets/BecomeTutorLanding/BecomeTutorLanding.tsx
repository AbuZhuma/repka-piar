'use client';

import * as Accordion from '@radix-ui/react-accordion';
import { CheckCircle, ChevronDown, MessageCircle, Sparkles, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Link } from '@/i18n/routing';
import { getPlatformStats, type PlatformStats } from '@/shared/api/stats';
import { ROUTES } from '@/shared/config/routes';
import { Button } from '@/shared/ui/Button';
import { Container } from '@/shared/ui/Container';

import styles from './BecomeTutorLanding.module.scss';

const FAQ_INDEXES = [0, 1, 2, 3, 4, 5];

export function BecomeTutorLanding() {
  const t = useTranslations('become_tutor');
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    getPlatformStats()
      .then(setStats)
      .catch(() => null);
  }, []);

  const tutorsCount = stats?.tutors_total ?? null;
  const citiesCount = stats?.cities_total ?? null;
  const subjectsCount = stats?.subjects_total ?? null;

  return (
    <>
      {/* Hero */}
      <section className={styles.hero}>
        <Container className={styles.heroInner}>
          <h1 className={styles.heroTitle}>{t('hero.h1')}</h1>
          <p className={styles.heroSubtitle}>{t('hero.subtitle')}</p>
          <div className={styles.heroActions}>
            <Link href={ROUTES.becomeTutorRegister}>
              <Button variant="primary" size="lg">
                {t('hero.cta')}
              </Button>
            </Link>
            <Link href={ROUTES.login}>
              <Button variant="secondary" size="lg">
                {t('hero.login')}
              </Button>
            </Link>
          </div>
          <ul className={styles.stats}>
            <li>
              <strong>{tutorsCount != null ? tutorsCount : '—'}</strong>
              <span>{t('stats.tutors')}</span>
            </li>
            <li>
              <strong>{citiesCount != null ? citiesCount : '—'}</strong>
              <span>{t('stats.cities')}</span>
            </li>
            <li>
              <strong>{subjectsCount != null ? subjectsCount : '—'}</strong>
              <span>{t('stats.subjects')}</span>
            </li>
          </ul>
        </Container>
      </section>

      {/* Benefits */}
      <section className={styles.section}>
        <Container>
          <h2 className={styles.sectionTitle}>{t('benefits.title')}</h2>
          <div className={styles.benefits}>
            <article className={styles.benefit}>
              <span className={styles.benefitIcon}>
                <TrendingUp size={24} />
              </span>
              <h3>{t('benefits.items.leads_title')}</h3>
              <p>{t('benefits.items.leads_desc')}</p>
            </article>
            <article className={styles.benefit}>
              <span className={styles.benefitIcon}>
                <Sparkles size={24} />
              </span>
              <h3>{t('benefits.items.free_title')}</h3>
              <p>{t('benefits.items.free_desc')}</p>
            </article>
            <article className={styles.benefit}>
              <span className={styles.benefitIcon}>
                <MessageCircle size={24} />
              </span>
              <h3>{t('benefits.items.trust_title')}</h3>
              <p>{t('benefits.items.trust_desc')}</p>
            </article>
          </div>
        </Container>
      </section>

      {/* How */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <Container>
          <h2 className={styles.sectionTitle}>{t('how.title')}</h2>
          <ol className={styles.steps}>
            {[1, 2, 3].map((i) => (
              <li key={i} className={styles.step}>
                <span className={styles.stepNum}>{i}</span>
                <div>
                  <h3>{t(`how.step${i}_title`)}</h3>
                  <p>{t(`how.step${i}_desc`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Perks */}
      <section className={styles.section}>
        <Container>
          <h2 className={styles.sectionTitle}>{t('perks.title')}</h2>
          <ul className={styles.perks}>
            {(t.raw('perks.items') as string[]).map((item) => (
              <li key={item}>
                <CheckCircle size={18} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* FAQ */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <Container>
          <h2 className={styles.sectionTitle}>{t('faq.title')}</h2>
          <Accordion.Root type="single" collapsible className={styles.faq}>
            {FAQ_INDEXES.map((i) => {
              const items = t.raw('faq.items') as Array<{ q: string; a: string }>;
              const item = items[i];
              if (!item) return null;
              return (
                <Accordion.Item key={i} value={`q-${i}`} className={styles.faqItem}>
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
              );
            })}
          </Accordion.Root>
        </Container>
      </section>

      {/* CTA block */}
      <section className={styles.ctaBlock}>
        <Container className={styles.ctaInner}>
          <h2>{t('cta_block.title')}</h2>
          <p>{t('cta_block.subtitle')}</p>
          <Link href={ROUTES.becomeTutorRegister}>
            <Button variant="primary" size="lg">
              {t('cta_block.button')}
            </Button>
          </Link>
        </Container>
      </section>

    </>
  );
}
