'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { forgotPassword } from '@/features/auth';
import { Link } from '@/i18n/routing';
import { ROUTES } from '@/shared/config/routes';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';

import styles from './page.module.scss';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgot');
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    try {
      await forgotPassword(value.trim());
    } catch {
      // Backend always returns 200 to avoid leaks; ignore errors
    }
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className={styles.card}>
      {!submitted ? (
        <>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.subtitle}>{t('subtitle')}</p>
          <form className={styles.form} onSubmit={onSubmit}>
            <Input
              label="Email / Телефон"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
              required
            />
            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              {t('submit')}
            </Button>
          </form>
        </>
      ) : (
        <>
          <h1 className={styles.title}>{t('sent_title')}</h1>
          <p className={styles.subtitle}>{t('sent_text')}</p>
        </>
      )}

      <Link href={ROUTES.login} className={styles.back}>
        {t('back_to_login')}
      </Link>
    </div>
  );
}
