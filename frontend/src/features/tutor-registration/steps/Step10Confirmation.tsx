'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { getDictionaries } from '@/shared/api/dictionaries';
import { useRouter } from '@/i18n/routing';
import { ROUTES } from '@/shared/config/routes';
import { ApiError, apiPost } from '@/shared/lib/api';
import { formatPrice } from '@/shared/lib/format';
import type { City, Subject } from '@/shared/types';

import { StepShell } from '../StepShell';
import { useRegistrationStore } from '../useRegistrationStore';

export function Step10Confirmation() {
  const t = useTranslations('register.step10');
  const tRegister = useTranslations('register');
  const tErrors = useTranslations('auth.errors');
  const router = useRouter();
  const reset = useRegistrationStore((s) => s.reset);
  const data = useRegistrationStore((s) => ({
    name: s.name,
    surname: s.surname,
    email: s.email,
    phone: s.phone,
    cityId: s.cityId,
    experienceYears: s.experienceYears,
    subjectIds: s.subjectIds,
    pricePer60: s.pricePer60,
    pricePer90: s.pricePer90,
    trialEnabled: s.trialEnabled,
    contactPhone: s.contactPhone,
    contactWhatsapp: s.contactWhatsapp,
    contactTelegram: s.contactTelegram,
  }));

  const [cities, setCities] = useState<City[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDictionaries()
      .then((d) => {
        setCities(d.cities);
        setSubjects(d.subjects);
      })
      .catch(() => null);
  }, []);

  const cityName = cities.find((c) => c.id === data.cityId)?.name_ru ?? '—';
  const subjectNames =
    data.subjectIds
      .map((id) => subjects.find((s) => s.id === id)?.name_ru)
      .filter(Boolean)
      .join(', ') || '—';

  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiPost('/api/tutors/me/submit-for-review');
      reset();
      router.push(ROUTES.becomeTutorSuccess);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : tErrors('generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepShell
      title={t('title')}
      onNext={onSubmit}
      nextLabel={tRegister('submit')}
      loading={loading}
      error={error}
    >
      <Section title={t('section_about')}>
        <Item label={t('field_full_name')} value={`${data.name} ${data.surname}`} />
        <Item label={t('field_email')} value={data.email} />
        <Item label={t('field_phone')} value={data.phone} />
        <Item label={t('field_city')} value={cityName} />
      </Section>

      <Section title={t('section_pro')}>
        <Item label={t('field_experience')} value={`${data.experienceYears} лет`} />
        <Item label={t('field_subjects')} value={subjectNames} />
      </Section>

      <Section title={t('section_prices')}>
        <Item
          label={t('field_price_60')}
          value={data.pricePer60 ? formatPrice(data.pricePer60, 'KGS', 'ru') : '—'}
        />
        {data.pricePer90 && (
          <Item label={t('field_price_90')} value={formatPrice(data.pricePer90, 'KGS', 'ru')} />
        )}
        {data.trialEnabled && <Item label={t('field_trial')} value={t('field_trial_yes')} />}
      </Section>

      <Section title={t('section_contacts')}>
        <Item label={t('field_phone')} value={data.contactPhone} />
        {data.contactWhatsapp && <Item label="WhatsApp" value={data.contactWhatsapp} />}
        {data.contactTelegram && <Item label="Telegram" value={data.contactTelegram} />}
      </Section>
    </StepShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--color-bg-secondary)',
        borderRadius: 8,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <h4
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--color-text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {title}
      </h4>
      {children}
    </div>
  );
}

function Item({ label, value }: { label: string; value: string | number | undefined | null }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14 }}>
      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{value || '—'}</span>
    </div>
  );
}
