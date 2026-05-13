import { CheckCircle, FileCheck, Phone, Sparkles } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Link } from '@/i18n/routing';
import { ROUTES } from '@/shared/config/routes';
import { Button } from '@/shared/ui/Button';
import { Container } from '@/shared/ui/Container';

import styles from './page.module.scss';

export default async function SuccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('register.success');

  const steps = [
    { icon: <FileCheck size={20} />, label: t('step_check'), active: true },
    { icon: <Phone size={20} />, label: t('step_call'), active: false },
    { icon: <Sparkles size={20} />, label: t('step_publish'), active: false },
  ];

  return (
    <Container className={styles.wrap}>
      <div className={styles.card}>
        <span className={styles.iconBig}>
          <CheckCircle size={56} />
        </span>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.subtitle}>{t('subtitle')}</p>

        <ol className={styles.steps}>
          {steps.map((step, i) => (
            <li key={i} className={step.active ? styles.stepActive : styles.step}>
              <span className={styles.stepIcon}>{step.icon}</span>
              <span className={styles.stepLabel}>{step.label}</span>
            </li>
          ))}
        </ol>

        <p className={styles.note}>{t('note')}</p>

        <div className={styles.actions}>
          <Link href={ROUTES.cabinet}>
            <Button variant="primary" size="lg">
              {t('to_cabinet')}
            </Button>
          </Link>
          <Link href={ROUTES.home}>
            <Button variant="ghost" size="lg">
              {t('to_home')}
            </Button>
          </Link>
        </div>
      </div>
    </Container>
  );
}
