'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { getDictionaries } from '@/shared/api/dictionaries';
import { ApiError, apiPatch } from '@/shared/lib/api';
import { Input } from '@/shared/ui/Input';
import { RadioGroup } from '@/shared/ui/RadioGroup';
import { Select } from '@/shared/ui/Select';
import { Textarea } from '@/shared/ui/Textarea';
import type { City } from '@/shared/types';

import { StepShell } from '../StepShell';
import { useRegistrationStore } from '../useRegistrationStore';

export function Step2About() {
  const t = useTranslations('register.step2');
  const tErrors = useTranslations('auth.errors');
  const update = useRegistrationStore((s) => s.update);
  const next = useRegistrationStore((s) => s.next);
  const data = useRegistrationStore((s) => ({
    birthDate: s.birthDate,
    gender: s.gender,
    cityId: s.cityId,
    shortBio: s.shortBio,
    photoUrl: s.photoUrl,
  }));

  const [cities, setCities] = useState<City[]>([]);
  const [birthDate, setBirthDate] = useState(data.birthDate ?? '');
  const [gender, setGender] = useState<'male' | 'female' | undefined>(data.gender);
  const [cityId, setCityId] = useState<string | undefined>(data.cityId);
  const [bio, setBio] = useState(data.shortBio ?? '');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(data.photoUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDictionaries()
      .then((d) => setCities(d.cities))
      .catch(() => null);
  }, []);

  const onPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Файл слишком большой (макс 5 МБ)');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'}/api/tutors/me/photo`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token') ?? ''}`,
          },
          body: fd,
        },
      );
      if (!resp.ok) throw new Error('upload failed');
      const json: { url: string } = await resp.json();
      setPhotoUrl(json.url);
    } catch {
      setError(tErrors('generic'));
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiPatch('/api/tutors/me', {
        short_bio: bio || undefined,
        city_id: cityId,
      });
      update({ birthDate, gender, cityId, shortBio: bio, photoUrl });
      next();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : tErrors('generic'));
    } finally {
      setLoading(false);
    }
  };

  const cityOptions = cities.map((c) => ({ value: c.id, label: c.name_ru }));

  return (
    <StepShell title={t('title')} onNext={onSubmit} loading={loading} error={error}>
      <Input
        label={t('birth_date')}
        type="date"
        value={birthDate}
        onChange={(e) => setBirthDate(e.target.value)}
      />

      <div>
        <label
          style={{
            fontSize: 13,
            color: 'var(--color-text-secondary)',
            fontWeight: 500,
            display: 'block',
            marginBottom: 8,
          }}
        >
          {t('gender')}
        </label>
        <RadioGroup
          value={gender}
          onValueChange={(v) => setGender(v as 'male' | 'female')}
          options={[
            { value: 'male', label: t('gender_male') },
            { value: 'female', label: t('gender_female') },
          ]}
        />
      </div>

      <div>
        <label
          style={{
            fontSize: 13,
            color: 'var(--color-text-secondary)',
            fontWeight: 500,
            display: 'block',
            marginBottom: 8,
          }}
        >
          {t('city')}
        </label>
        <Select
          value={cityId}
          onValueChange={setCityId}
          options={cityOptions}
          placeholder={t('city')}
        />
      </div>

      <div>
        <label
          style={{
            fontSize: 13,
            color: 'var(--color-text-secondary)',
            fontWeight: 500,
            display: 'block',
            marginBottom: 8,
          }}
        >
          {t('photo')}
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onPhotoChange}
          disabled={uploading}
        />
        {uploading && (
          <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 8 }}>
            Загрузка...
          </p>
        )}
        {photoUrl && (
          <p style={{ fontSize: 12, color: 'var(--color-success)', marginTop: 8 }}>
            ✓ {t('photo_uploaded')}
          </p>
        )}
      </div>

      <Textarea
        label={t('short_bio')}
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        hint={t('short_bio_hint')}
        counter={{ value: bio.length, max: 500 }}
        maxLength={500}
      />
    </StepShell>
  );
}
