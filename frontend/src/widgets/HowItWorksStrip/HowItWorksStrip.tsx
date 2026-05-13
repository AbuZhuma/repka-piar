import { MessageCircle, Search, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Container } from '@/shared/ui/Container';

import styles from './HowItWorksStrip.module.scss';

export function HowItWorksStrip() {
  const t = useTranslations();
  const steps = [
    {
      icon: <Search size={22} />,
      title: t('how_it_works.step1_title'),
      desc: t('how_it_works.step1_desc'),
    },
    {
      icon: <MessageCircle size={22} />,
      title: t('how_it_works.step2_title'),
      desc: t('how_it_works.step2_desc'),
    },
    {
      icon: <Sparkles size={22} />,
      title: t('how_it_works.step3_title'),
      desc: t('how_it_works.step3_desc'),
    },
  ];
  return (
    <section className={styles.section}>
      <Container>
        <h2 className={styles.title}>{t('homepage.how_it_works_title')}</h2>
        <ol className={styles.steps}>
          {steps.map((step, idx) => (
            <li key={idx} className={styles.step}>
              <span className={styles.icon}>{step.icon}</span>
              <span className={styles.body}>
                <strong className={styles.stepTitle}>
                  <span className={styles.stepNum}>{idx + 1}.</span> {step.title}
                </strong>
                <span className={styles.stepDesc}>{step.desc}</span>
              </span>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
