'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { registerUser, useAuthStore } from '@/features/auth';
import { Link, useRouter } from '@/i18n/routing';
import { ROUTES } from '@/shared/config/routes';
import { ApiError } from '@/shared/lib/api';
import { auth } from '@/shared/lib/auth';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';

import styles from '../login/page.module.scss';

const schema = z.object({
  name: z.string().trim().min(1, 'required').max(80),
  surname: z.string().trim().max(80).optional(),
  email: z.string().email(),
  phone: z
    .string()
    .trim()
    .optional()
    .refine(
      (v) => !v || /^\+(?:996|7|998|992)\d{9,10}$/.test(v),
      'phone must be in international format, e.g. +996700000000',
    ),
  password: z.string().min(8).max(128),
  agree: z.literal(true, {
    errorMap: () => ({ message: 'required' }),
  }),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    setSubmitError(null);
    try {
      const resp = await registerUser({
        email: data.email.trim().toLowerCase(),
        name: data.name.trim(),
        surname: data.surname?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        password: data.password,
        role: 'student',
      });
      auth.setTokens(resp.access_token, resp.refresh_token);
      setUser(resp.user);
      router.push('/me?welcome=1');
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setSubmitError(t('errors.already_registered'));
      } else if (e instanceof ApiError && e.status === 400) {
        setSubmitError(e.message || t('errors.generic'));
      } else {
        setSubmitError(t('errors.generic'));
      }
    }
  };

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>{t('register_title')}</h1>
      <p className={styles.subtitle}>{t('register_subtitle')}</p>

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label={t('first_name')}
          autoComplete="given-name"
          {...register('name')}
          error={errors.name ? '—' : undefined}
        />
        <Input
          label={t('last_name_optional')}
          autoComplete="family-name"
          {...register('surname')}
          error={errors.surname ? '—' : undefined}
        />
        <Input
          label={t('email')}
          type="email"
          autoComplete="email"
          {...register('email')}
          error={errors.email ? '—' : undefined}
        />
        <Input
          label={t('phone_optional')}
          type="tel"
          autoComplete="tel"
          placeholder="+996700000000"
          {...register('phone')}
          error={errors.phone ? errors.phone.message ?? '—' : undefined}
        />
        <Input
          label={t('password')}
          type="password"
          autoComplete="new-password"
          {...register('password')}
          error={errors.password ? t('errors.password_too_short') : undefined}
          hint={t('password_hint')}
        />

        <label className={styles.checkboxRow}>
          <input type="checkbox" {...register('agree')} />
          <span>
            {t('agree_text')}{' '}
            <Link href={ROUTES.legal.offer} className={styles.link}>
              {t('agree_offer')}
            </Link>{' '}
            {t('and')}{' '}
            <Link href={ROUTES.legal.privacy} className={styles.link}>
              {t('agree_privacy')}
            </Link>
          </span>
        </label>

        {submitError && <p className={styles.error}>{submitError}</p>}

        <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting}>
          {t('register_button')}
        </Button>
      </form>

      <div className={styles.links}>
        <Link href={ROUTES.login} className={styles.link}>
          {t('have_account')}
        </Link>
        <Link href={ROUTES.becomeTutor} className={styles.link}>
          {t('be_tutor_instead')}
        </Link>
      </div>
    </div>
  );
}
