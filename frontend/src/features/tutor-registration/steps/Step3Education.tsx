'use client';

import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { ApiError, apiPost } from '@/shared/lib/api';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';

import { StepShell } from '../StepShell';
import { useRegistrationStore } from '../useRegistrationStore';
import type { EducationEntry } from '../useRegistrationStore';

export function Step3Education() {
  const t = useTranslations('register.step3');
  const tErrors = useTranslations('auth.errors');
  const update = useRegistrationStore((s) => s.update);
  const next = useRegistrationStore((s) => s.next);
  const stored = useRegistrationStore((s) => s.education);

  const [items, setItems] = useState<EducationEntry[]>(
    stored.length > 0 ? stored : [{ institution: '', specialty: '' }],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateItem = (idx: number, patch: Partial<EducationEntry>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const addItem = () => {
    setItems((prev) => [...prev, { institution: '', specialty: '' }]);
  };

  const onSubmit = async () => {
    const filled = items.filter((it) => it.institution.trim().length > 0);
    if (filled.length === 0) {
      setError(t('empty'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      for (const it of filled) {
        await apiPost('/api/tutors/me/education', {
          institution: it.institution,
          specialty: it.specialty || undefined,
          year_start: it.yearStart,
          year_end: it.yearEnd,
        });
      }
      update({ education: filled });
      next();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : tErrors('generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepShell title={t('title')} onNext={onSubmit} loading={loading} error={error}>
      {items.map((it, idx) => (
        <div
          key={idx}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            padding: 16,
            background: 'var(--color-bg-secondary)',
            borderRadius: 8,
          }}
        >
          <Input
            label={t('institution')}
            value={it.institution}
            onChange={(e) => updateItem(idx, { institution: e.target.value })}
          />
          <Input
            label={t('specialty')}
            value={it.specialty ?? ''}
            onChange={(e) => updateItem(idx, { specialty: e.target.value })}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label={t('year_start')}
              type="number"
              value={it.yearStart ?? ''}
              onChange={(e) =>
                updateItem(idx, { yearStart: e.target.value ? Number(e.target.value) : undefined })
              }
            />
            <Input
              label={t('year_end')}
              type="number"
              value={it.yearEnd ?? ''}
              onChange={(e) =>
                updateItem(idx, { yearEnd: e.target.value ? Number(e.target.value) : undefined })
              }
            />
          </div>
          {items.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              leftIcon={<Trash2 size={14} />}
              onClick={() => removeItem(idx)}
            >
              {t('remove')}
            </Button>
          )}
        </div>
      ))}
      <Button variant="ghost" size="sm" type="button" onClick={addItem}>
        {t('add')}
      </Button>
    </StepShell>
  );
}
