'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { registerUser, useAuthStore } from '@/features/auth';
import { Link } from '@/i18n/routing';
import { ROUTES } from '@/shared/config/routes';
import { ApiError, apiPost } from '@/shared/lib/api';
import { auth } from '@/shared/lib/auth';
import { Checkbox } from '@/shared/ui/Checkbox';
import { Input } from '@/shared/ui/Input';

import { StepShell } from '../StepShell';
import { useRegistrationStore } from '../useRegistrationStore';

const phoneRegex = /^\+(?:996|7|998|992)\d{9,10}$/;

const schema = z.object({
  name: z.string().trim().min(1, 'name'),
  surname: z.string().trim().min(1, 'surname'),
  email: z.string().trim().email('email'),
  phone: z.string().trim().regex(phoneRegex, 'phone'),
  password: z.string().min(8, 'password'),
  agreeTerms: z.boolean().refine((v) => v === true, 'agree'),
});

type FormValues = z.infer<typeof schema>;

interface StepProps {
  onSaved?: () => void;
}

export function Step1Contacts({ onSaved }: StepProps) {
  const t = useTranslations('register.step1');
  const tErrors = useTranslations('auth.errors');
  const setUser = useAuthStore((s) => s.setUser);
  const update = useRegistrationStore((s) => s.update);
  const next = useRegistrationStore((s) => s.next);
  const stored = useRegistrationStore((s) => ({
    name: s.name,
    surname: s.surname,
    email: s.email,
    phone: s.phone,
    agreeTerms: s.agreeTerms,
  }));

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [agree, setAgree] = useState<boolean>(stored.agreeTerms);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: stored.name,
      surname: stored.surname,
      email: stored.email,
      phone: stored.phone,
      password: '',
      agreeTerms: stored.agreeTerms,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setSubmitError(null);
    try {
      const resp = await registerUser({
        email: data.email,
        phone: data.phone,
        password: data.password,
        name: data.name,
        surname: data.surname,
      });
      auth.setTokens(resp.access_token, resp.refresh_token);
      setUser(resp.user);

      // Create empty tutor profile so subsequent steps can PATCH it
      try {
        await apiPost('/api/tutors/me', {});
      } catch (e) {
        if (!(e instanceof ApiError && e.status === 409)) throw e;
      }

      update({
        name: data.name,
        surname: data.surname,
        email: data.email,
        phone: data.phone,
        password: data.password,
        agreeTerms: data.agreeTerms,
      });
      onSaved?.();
      next();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setSubmitError(tErrors('conflict'));
      } else if (e instanceof ApiError && e.status === 400) {
        setSubmitError(e.message);
      } else {
        setSubmitError(tErrors('generic'));
      }
    }
  };

  const errorText = (key?: string): string | undefined => {
    if (!key) return undefined;
    switch (key) {
      case 'email':
        return tErrors('invalid_email');
      case 'phone':
        return tErrors('invalid_phone');
      case 'password':
        return tErrors('weak_password');
      case 'agree':
        return tErrors('must_agree');
      default:
        return '—';
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <StepShell
        title={t('title')}
        subtitle={t('subtitle')}
        onNext={() => handleSubmit(onSubmit)()}
        loading={isSubmitting}
        error={submitError}
        hideBack
      >
        <Input label={t('name')} {...register('name')} error={errorText(errors.name?.message)} />
        <Input
          label={t('surname')}
          {...register('surname')}
          error={errorText(errors.surname?.message)}
        />
        <Input
          label={t('email')}
          type="email"
          {...register('email')}
          error={errorText(errors.email?.message)}
        />
        <Input
          label="Телефон"
          placeholder={t('phone_placeholder')}
          {...register('phone')}
          error={errorText(errors.phone?.message)}
        />
        <Input
          label="Пароль"
          type="password"
          autoComplete="new-password"
          hint="Минимум 8 символов"
          {...register('password')}
          error={errorText(errors.password?.message)}
        />
        <Checkbox
          checked={agree}
          onCheckedChange={(v) => {
            const checked = v === true;
            setAgree(checked);
            setValue('agreeTerms', checked, { shouldValidate: true });
          }}
          label={
            <>
              {t('agree')}{' '}
              <Link href={ROUTES.legal.offer} className="legal-link">
                ({t('agree_link_offer')})
              </Link>
            </>
          }
        />
        {errors.agreeTerms && (
          <span style={{ color: 'var(--color-danger)', fontSize: 12 }}>
            {tErrors('must_agree')}
          </span>
        )}
      </StepShell>
    </form>
  );
}
