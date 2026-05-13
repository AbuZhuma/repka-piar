'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { resetPassword } from '@/features/auth';
import { Link, useRouter } from '@/i18n/routing';
import { ROUTES } from '@/shared/config/routes';
import { ApiError } from '@/shared/lib/api';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';

import styles from './page.module.scss';

export default function ResetPasswordPage() {
  const t = useTranslations('auth');
  const search = useSearchParams();
  const router = useRouter();
  const token = search?.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError(t('reset.missing_token'));
      return;
    }
    if (password.length < 8) {
      setError(t('errors.weak_password'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push(ROUTES.login), 1800);
    } catch (e) {
      if (e instanceof ApiError && e.status === 400) {
        setError(t('reset.missing_token'));
      } else {
        setError(t('errors.generic'));
      }
    }
    setSubmitting(false);
  };

  if (!token && !done) {
    return (
      <div className={styles.card}>
        <h1 className={styles.title}>{t('reset.title')}</h1>
        <p className={styles.error}>{t('reset.missing_token')}</p>
        <Link href={ROUTES.forgotPassword} className={styles.link}>
          {t('forgot.title')}
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className={styles.card}>
        <h1 className={styles.title}>{t('reset.success_title')}</h1>
        <p className={styles.subtitle}>{t('reset.success_text')}</p>
        <Link href={ROUTES.login} className={styles.link}>
          {t('reset.to_login')} →
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>{t('reset.title')}</h1>
      <p className={styles.subtitle}>{t('reset.subtitle')}</p>
      <form className={styles.form} onSubmit={onSubmit}>
        <Input
          label={t('reset.new_password')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          hint={t('password_hint')}
          autoFocus
        />
        {error && <p className={styles.error}>{error}</p>}
        <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
          {t('reset.submit')}
        </Button>
      </form>
    </div>
  );
}
