'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { AGE_GROUPS, GOALS, TEACHING_LANGUAGES } from '@/shared/config/constants';
import { getDictionaries } from '@/shared/api/dictionaries';
import { ApiError, apiPatch } from '@/shared/lib/api';
import { Checkbox } from '@/shared/ui/Checkbox';
import { Input } from '@/shared/ui/Input';
import type { Subject } from '@/shared/types';

import { StepShell } from '../StepShell';
import { useRegistrationStore } from '../useRegistrationStore';

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

export function Step4Subjects() {
  const t = useTranslations('register.step4');
  const tGoals = useTranslations('goals');
  const tAges = useTranslations('age_groups');
  const tLangs = useTranslations('languages');
  const tErrors = useTranslations('auth.errors');

  const update = useRegistrationStore((s) => s.update);
  const next = useRegistrationStore((s) => s.next);
  const stored = useRegistrationStore((s) => ({
    experienceYears: s.experienceYears,
    subjectIds: s.subjectIds,
    goals: s.goals,
    ageGroups: s.ageGroups,
    languages: s.languages,
    isNativeSpeaker: s.isNativeSpeaker,
  }));

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exp, setExp] = useState<number>(stored.experienceYears);
  const [subjectIds, setSubjectIds] = useState<string[]>(stored.subjectIds);
  const [goals, setGoals] = useState<string[]>(stored.goals);
  const [ages, setAges] = useState<string[]>(stored.ageGroups);
  const [langCodes, setLangCodes] = useState<string[]>(stored.languages.map((l) => l.code));
  const [native, setNative] = useState<boolean>(stored.isNativeSpeaker);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDictionaries()
      .then((d) => setSubjects(d.subjects))
      .catch(() => null);
  }, []);

  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiPatch('/api/tutors/me', {
        experience_years: exp,
        is_native_speaker: native,
      });
      update({
        experienceYears: exp,
        subjectIds,
        goals,
        ageGroups: ages,
        languages: langCodes.map((code) => ({ code })),
        isNativeSpeaker: native,
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
        label={t('experience_label')}
        type="number"
        min={0}
        max={60}
        value={exp || ''}
        onChange={(e) => setExp(Number(e.target.value) || 0)}
      />

      <FilterBlock title={t('subjects_title')}>
        {subjects.map((s) => (
          <Checkbox
            key={s.id}
            label={s.name_ru}
            checked={subjectIds.includes(s.id)}
            onCheckedChange={() => setSubjectIds((p) => toggle(p, s.id))}
          />
        ))}
      </FilterBlock>

      <FilterBlock title={t('goals_title')}>
        {GOALS.map((g) => (
          <Checkbox
            key={g}
            label={tGoals(g)}
            checked={goals.includes(g)}
            onCheckedChange={() => setGoals((p) => toggle(p, g))}
          />
        ))}
      </FilterBlock>

      <FilterBlock title={t('ages_title')}>
        {AGE_GROUPS.map((a) => (
          <Checkbox
            key={a}
            label={tAges(a)}
            checked={ages.includes(a)}
            onCheckedChange={() => setAges((p) => toggle(p, a))}
          />
        ))}
      </FilterBlock>

      <FilterBlock title={t('languages_title')}>
        {TEACHING_LANGUAGES.map((l) => (
          <Checkbox
            key={l}
            label={tLangs(l)}
            checked={langCodes.includes(l)}
            onCheckedChange={() => setLangCodes((p) => toggle(p, l))}
          />
        ))}
      </FilterBlock>

      <Checkbox
        label={t('is_native')}
        checked={native}
        onCheckedChange={(v) => setNative(v === true)}
      />
    </StepShell>
  );
}

function FilterBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: 8,
        }}
      >
        {title}
      </h4>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 4,
        }}
      >
        {children}
      </div>
    </div>
  );
}
