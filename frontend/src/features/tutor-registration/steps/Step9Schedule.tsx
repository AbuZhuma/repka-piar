'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { ApiError, apiPatch } from '@/shared/lib/api';
import { Input } from '@/shared/ui/Input';
import { Textarea } from '@/shared/ui/Textarea';

import { StepShell } from '../StepShell';
import { useRegistrationStore } from '../useRegistrationStore';

export function Step9Schedule() {
  const t = useTranslations('register.step9');
  const tErrors = useTranslations('auth.errors');
  const update = useRegistrationStore((s) => s.update);
  const next = useRegistrationStore((s) => s.next);
  const stored = useRegistrationStore((s) => ({
    scheduleText: s.scheduleText,
    description: s.description,
  }));

  const [schedule, setSchedule] = useState(stored.scheduleText ?? '');
  const [description, setDescription] = useState(stored.description ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiPatch('/api/tutors/me', {
        schedule_text: schedule || undefined,
        bio: description || undefined,
      });
      update({ scheduleText: schedule, description });
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
        label={t('schedule_label')}
        value={schedule}
        onChange={(e) => setSchedule(e.target.value)}
        placeholder={t('schedule_placeholder')}
      />
      <Textarea
        label={t('description_label')}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        hint={t('description_hint')}
        rows={6}
      />
    </StepShell>
  );
}
