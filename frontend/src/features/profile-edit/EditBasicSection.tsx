'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useEditor } from '@/widgets/ProfileEditor/EditorContext';
import { getDictionaries } from '@/shared/api/dictionaries';
import { ApiError, apiPatch } from '@/shared/lib/api';
import { Checkbox } from '@/shared/ui/Checkbox';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Textarea } from '@/shared/ui/Textarea';
import type { City } from '@/shared/types';

import { SectionShell } from './SectionShell';

export function EditBasicSection() {
  const t = useTranslations('cabinet.profile_edit');
  const { profile, setProfile } = useEditor();
  const [cities, setCities] = useState<City[]>([]);
  const [shortBio, setShortBio] = useState(profile.short_bio ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [cityId, setCityId] = useState(profile.city_id ?? '');
  const [experienceYears, setExperienceYears] = useState(profile.experience_years);
  const [isNative, setIsNative] = useState(profile.is_native_speaker);
  const [specs, setSpecs] = useState((profile.specializations ?? []).join(', '));
  const [scheduleText, setScheduleText] = useState(profile.schedule_text ?? '');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDictionaries()
      .then((d) => setCities(d.cities))
      .catch(() => null);
  }, []);

  const cityOptions = cities.map((c) => ({ value: c.id, label: c.name_ru }));

  const onSave = async () => {
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const specializations = specs
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await apiPatch('/api/tutors/me', {
        short_bio: shortBio || null,
        bio: bio || null,
        city_id: cityId || null,
        experience_years: experienceYears,
        is_native_speaker: isNative,
        specializations,
        schedule_text: scheduleText || null,
      });
      setProfile((prev) => ({
        ...prev,
        short_bio: shortBio,
        bio,
        city_id: cityId || null,
        city: cities.find((c) => c.id === cityId)
          ? {
              id: cityId,
              slug: cities.find((c) => c.id === cityId)!.slug,
              name_ru: cities.find((c) => c.id === cityId)!.name_ru,
            }
          : null,
        experience_years: experienceYears,
        is_native_speaker: isNative,
        specializations,
        schedule_text: scheduleText,
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
      id="basic"
      title={t('section_basic')}
      onSave={onSave}
      loading={loading}
      saved={saved}
      error={error}
    >
      <Textarea
        label={t('short_bio')}
        value={shortBio}
        onChange={(e) => {
          setShortBio(e.target.value);
          setSaved(false);
        }}
        hint={t('short_bio_hint')}
        counter={{ value: shortBio.length, max: 500 }}
        maxLength={500}
      />
      <Textarea
        label={t('bio')}
        value={bio}
        onChange={(e) => {
          setBio(e.target.value);
          setSaved(false);
        }}
        hint={t('bio_hint')}
        rows={6}
      />
      <div>
        <label
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--color-text-secondary)',
            display: 'block',
            marginBottom: 8,
          }}
        >
          {t('city')}
        </label>
        <Select
          value={cityId}
          onValueChange={(v) => {
            setCityId(v);
            setSaved(false);
          }}
          placeholder={t('city_placeholder')}
          options={cityOptions}
        />
      </div>
      <Input
        label={t('experience_years')}
        type="number"
        min={0}
        max={60}
        value={experienceYears || ''}
        onChange={(e) => {
          setExperienceYears(Number(e.target.value) || 0);
          setSaved(false);
        }}
      />
      <Input
        label={t('specializations')}
        value={specs}
        onChange={(e) => {
          setSpecs(e.target.value);
          setSaved(false);
        }}
        placeholder="IELTS, OGT, разговорный"
      />
      <Input
        label={t('schedule')}
        value={scheduleText}
        onChange={(e) => {
          setScheduleText(e.target.value);
          setSaved(false);
        }}
        hint={t('schedule_hint')}
      />
      <Checkbox
        label={t('is_native')}
        checked={isNative}
        onCheckedChange={(v) => {
          setIsNative(v === true);
          setSaved(false);
        }}
      />
    </SectionShell>
  );
}
