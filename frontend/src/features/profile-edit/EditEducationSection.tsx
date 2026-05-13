'use client';

import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { ApiError, apiDelete, apiGet, apiPost } from '@/shared/lib/api';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';

import { SectionShell } from './SectionShell';

interface EduEntry {
  id?: string;
  institution: string;
  specialty?: string | null;
  year_start?: number | null;
  year_end?: number | null;
}

interface FullProfile {
  education: EduEntry[];
}

export function EditEducationSection() {
  const t = useTranslations('cabinet.profile_edit');
  const [items, setItems] = useState<EduEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    try {
      // The /api/tutors/me endpoint returns full profile with relations
      const me = await apiGet<{ education?: EduEntry[] }>('/api/tutors/me');
      setItems(me.education ?? []);
    } catch {
      // ignore — list might be empty
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const addDraft = () => {
    setItems((prev) => [...prev, { institution: '' }]);
  };

  const updateField = <K extends keyof EduEntry>(idx: number, key: K, value: EduEntry[K]) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [key]: value } : it)));
    setSaved(false);
  };

  const onSave = async (idx: number) => {
    const it = items[idx];
    if (!it.institution.trim()) return;
    if (it.id) return; // already saved
    setLoading(true);
    setError(null);
    try {
      const created = await apiPost<EduEntry>('/api/tutors/me/education', {
        institution: it.institution,
        specialty: it.specialty || undefined,
        year_start: it.year_start ?? undefined,
        year_end: it.year_end ?? undefined,
      });
      setItems((prev) => prev.map((x, i) => (i === idx ? created : x)));
      setSaved(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('save_error'));
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (idx: number) => {
    const it = items[idx];
    setError(null);
    if (it.id) {
      try {
        await apiDelete(`/api/tutors/me/education/${it.id}`);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : t('save_error'));
        return;
      }
    }
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <SectionShell
      id="education"
      title={t('section_education')}
      hideSave
      saved={saved}
      error={error}
    >
      {items.map((it, idx) => (
        <div
          key={it.id ?? `draft-${idx}`}
          style={{
            background: 'var(--color-bg-secondary)',
            padding: 16,
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <Input
            label={t('institution')}
            value={it.institution}
            onChange={(e) => updateField(idx, 'institution', e.target.value)}
            disabled={Boolean(it.id)}
          />
          <Input
            label={t('specialty')}
            value={it.specialty ?? ''}
            onChange={(e) => updateField(idx, 'specialty', e.target.value)}
            disabled={Boolean(it.id)}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label={t('year_start')}
              type="number"
              value={it.year_start ?? ''}
              onChange={(e) =>
                updateField(idx, 'year_start', e.target.value ? Number(e.target.value) : null)
              }
              disabled={Boolean(it.id)}
            />
            <Input
              label={t('year_end')}
              type="number"
              value={it.year_end ?? ''}
              onChange={(e) =>
                updateField(idx, 'year_end', e.target.value ? Number(e.target.value) : null)
              }
              disabled={Boolean(it.id)}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {!it.id && (
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={() => void onSave(idx)}
                loading={loading}
              >
                {t('save')}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              type="button"
              leftIcon={<Trash2 size={14} />}
              onClick={() => void onDelete(idx)}
            >
              {t('remove')}
            </Button>
          </div>
        </div>
      ))}
      <Button variant="ghost" size="sm" type="button" onClick={addDraft}>
        {t('education_add')}
      </Button>
    </SectionShell>
  );
}
