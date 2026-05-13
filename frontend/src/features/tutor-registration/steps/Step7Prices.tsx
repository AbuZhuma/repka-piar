'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { FORMATS } from '@/shared/config/constants';
import { ApiError, apiPatch } from '@/shared/lib/api';
import { Checkbox } from '@/shared/ui/Checkbox';
import { Input } from '@/shared/ui/Input';

import { StepShell } from '../StepShell';
import { useRegistrationStore } from '../useRegistrationStore';

export function Step7Prices() {
  const t = useTranslations('register.step7');
  const tFormats = useTranslations('formats');
  const tErrors = useTranslations('auth.errors');
  const update = useRegistrationStore((s) => s.update);
  const next = useRegistrationStore((s) => s.next);
  const stored = useRegistrationStore((s) => ({
    pricePer60: s.pricePer60,
    pricePer90: s.pricePer90,
    trialEnabled: s.trialEnabled,
    formats: s.formats,
    address: s.address,
    studentDistricts: s.studentDistricts,
  }));

  const [price60, setPrice60] = useState<number | undefined>(stored.pricePer60);
  const [price90, setPrice90] = useState<number | undefined>(stored.pricePer90);
  const [trial, setTrial] = useState(stored.trialEnabled);
  const [formats, setFormats] = useState<string[]>(stored.formats);
  const [address, setAddress] = useState(stored.address ?? '');
  const [districts, setDistricts] = useState((stored.studentDistricts ?? []).join(', '));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleFormat = (f: string) => {
    setFormats((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  };

  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiPatch('/api/tutors/me/prices', {
        price_per_60: price60,
        price_per_90: price90,
        trial_enabled: trial,
        currency: 'KGS',
      });
      const districtsArr = districts
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean);
      await apiPatch('/api/tutors/me', {
        address: formats.includes('at_tutor') ? address || null : null,
        student_districts: formats.includes('at_student') ? districtsArr : null,
      });
      update({
        pricePer60: price60,
        pricePer90: price90,
        trialEnabled: trial,
        formats,
        address,
        studentDistricts: districtsArr,
      });
      next();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : tErrors('generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepShell title={t('title')} onNext={onSubmit} loading={loading} error={error}>
      <Input
        label={t('price_60_label')}
        type="number"
        min={0}
        suffix={t('currency_suffix')}
        value={price60 ?? ''}
        onChange={(e) => setPrice60(e.target.value ? Number(e.target.value) : undefined)}
      />
      <Input
        label={t('price_90_label')}
        type="number"
        min={0}
        suffix={t('currency_suffix')}
        value={price90 ?? ''}
        onChange={(e) => setPrice90(e.target.value ? Number(e.target.value) : undefined)}
      />
      <Checkbox
        label={t('trial_enabled')}
        checked={trial}
        onCheckedChange={(v) => setTrial(v === true)}
      />

      <div>
        <label
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: 8,
            display: 'block',
          }}
        >
          {t('formats_title')}
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {FORMATS.map((f) => (
            <Checkbox
              key={f}
              label={tFormats(f)}
              checked={formats.includes(f)}
              onCheckedChange={() => toggleFormat(f)}
            />
          ))}
        </div>
      </div>

      {formats.includes('at_tutor') && (
        <Input label={t('address')} value={address} onChange={(e) => setAddress(e.target.value)} />
      )}
      {formats.includes('at_student') && (
        <Input
          label={t('districts')}
          value={districts}
          onChange={(e) => setDistricts(e.target.value)}
          placeholder="Центр, Джал, Восток-5"
        />
      )}
    </StepShell>
  );
}
