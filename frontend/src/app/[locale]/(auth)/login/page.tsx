'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { loginUser, useAuthStore } from '@/features/auth';
import { Link, useRouter } from '@/i18n/routing';
import { ROUTES } from '@/shared/config/routes';
import { ApiError } from '@/shared/lib/api';
import { auth } from '@/shared/lib/auth';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';

import styles from './page.module.scss';

const schema = z.object({
  emailOrPhone: z.string().min(1),
  password: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const search = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    setSubmitError(null);
    try {
      const resp = await loginUser({
        email_or_phone: data.emailOrPhone,
        password: data.password,
      });
      auth.setTokens(resp.access_token, resp.refresh_token);
      setUser(resp.user);
      const redirect = search?.get('redirect') ?? ROUTES.cabinet;
      router.push(redirect);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        setSubmitError(t('errors.invalid_credentials'));
      } else if (e instanceof ApiError && e.status === 429) {
        setSubmitError(t('errors.rate_limit'));
      } else {
        setSubmitError(t('errors.generic'));
      }
    }
  };

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>{t('login_title')}</h1>
      <p className={styles.subtitle}>{t('login_subtitle')}</p>

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label={t('email_or_phone')}
          autoComplete="username"
          {...register('emailOrPhone')}
          error={errors.emailOrPhone ? '—' : undefined}
        />
        <Input
          label={t('password')}
          type="password"
          autoComplete="current-password"
          {...register('password')}
          error={errors.password ? '—' : undefined}
        />

        {submitError && <p className={styles.error}>{submitError}</p>}

        <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting}>
          {t('login_button')}
        </Button>
      </form>

      <div className={styles.links}>
        <Link href={ROUTES.forgotPassword} className={styles.link}>
          {t('forgot_password')}
        </Link>
        <Link href={ROUTES.becomeTutor} className={styles.link}>
          {t('no_account')}
        </Link>
      </div>
    </div>
  );
}
