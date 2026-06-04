'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useEditor } from './model/EditorContext';
import { FORMATS } from '@/shared/config/constants';
import { ApiError, apiPatch } from '@/shared/lib/api';
import { Checkbox } from '@/shared/ui/Checkbox';
import { Input } from '@/shared/ui/Input';

import { SectionShell } from './SectionShell';

export function EditPricesSection() {
  const t = useTranslations('cabinet.profile_edit');
  const tFormats = useTranslations('formats');
  const { profile, setProfile } = useEditor();

  const [price60, setPrice60] = useState<number | ''>(profile.price_per_60 ?? '');
  const [price90, setPrice90] = useState<number | ''>(profile.price_per_90 ?? '');
  const [trial, setTrial] = useState(profile.trial_enabled);
  const [address, setAddress] = useState(profile.address ?? '');
  const [districts, setDistricts] = useState((profile.student_districts ?? []).join(', '));

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      await apiPatch('/api/tutors/me/prices', {
        price_per_60: price60 === '' ? null : Number(price60),
        price_per_90: price90 === '' ? null : Number(price90),
        trial_enabled: trial,
        currency: 'KGS',
      });
      const districtsArr = districts
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean);
      await apiPatch('/api/tutors/me', {
        address: address || null,
        student_districts: districtsArr.length > 0 ? districtsArr : null,
      });
      setProfile((prev) => ({
        ...prev,
        price_per_60: price60 === '' ? null : Number(price60),
        price_per_90: price90 === '' ? null : Number(price90),
        trial_enabled: trial,
        address: address || null,
        student_districts: districtsArr.length > 0 ? districtsArr : null,
      }));
      setSaved(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('save_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionShell
      id="prices"
      title={t('section_prices')}
      onSave={onSave}
      loading={loading}
      saved={saved}
      error={error}
    >
      <Input
        label={t('price_60')}
        type="number"
        min={0}
        suffix={t('currency_suffix')}
        value={price60}
        onChange={(e) => {
          setPrice60(e.target.value === '' ? '' : Number(e.target.value));
          setSaved(false);
        }}
      />
      <Input
        label={t('price_90')}
        type="number"
        min={0}
        suffix={t('currency_suffix')}
        value={price90}
        onChange={(e) => {
          setPrice90(e.target.value === '' ? '' : Number(e.target.value));
          setSaved(false);
        }}
      />
      <Checkbox
        label={t('trial_enabled')}
        checked={trial}
        onCheckedChange={(v) => {
          setTrial(v === true);
          setSaved(false);
        }}
      />
      <Input
        label={t('address')}
        value={address}
        onChange={(e) => {
          setAddress(e.target.value);
          setSaved(false);
        }}
        hint={t('address_hint')}
      />
      <Input
        label={t('districts')}
        value={districts}
        onChange={(e) => {
          setDistricts(e.target.value);
          setSaved(false);
        }}
      />
      <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
        {FORMATS.map((f) => tFormats(f)).join(' · ')}
      </div>
    </SectionShell>
  );
}
