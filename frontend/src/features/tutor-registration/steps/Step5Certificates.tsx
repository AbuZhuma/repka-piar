'use client';

import { FileText, Trash2, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';

import { StepShell } from '../StepShell';
import { useRegistrationStore } from '../useRegistrationStore';
import type { DocumentEntry } from '../useRegistrationStore';

export function Step5Certificates() {
  const t = useTranslations('register.step5');
  const tErrors = useTranslations('auth.errors');
  const update = useRegistrationStore((s) => s.update);
  const next = useRegistrationStore((s) => s.next);
  const stored = useRegistrationStore((s) => s.documents);

  const [docs, setDocs] = useState<DocumentEntry[]>(stored);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('Файл слишком большой (макс 10 МБ)');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', file.name);
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'}/api/tutors/me/documents`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token') ?? ''}`,
          },
          body: fd,
        },
      );
      if (!resp.ok) throw new Error('upload failed');
      const json: { id: string; title?: string; file_url: string } = await resp.json();
      setDocs((prev) => [...prev, { id: json.id, title: json.title ?? file.name, fileUrl: json.file_url }]);
    } catch {
      setError(tErrors('generic'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeDoc = (idx: number) => {
    setDocs((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateTitle = (idx: number, title: string) => {
    setDocs((prev) => prev.map((d, i) => (i === idx ? { ...d, title } : d)));
  };

  const onNext = () => {
    update({ documents: docs });
    next();
  };

  return (
    <StepShell
      title={t('title')}
      subtitle={t('subtitle')}
      onNext={onNext}
      showSkip
      onSkip={onNext}
      error={error}
    >
      <label
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          padding: 24,
          border: '2px dashed var(--color-border-primary)',
          borderRadius: 12,
          cursor: uploading ? 'wait' : 'pointer',
          background: 'var(--color-bg-secondary)',
        }}
      >
        <Upload size={28} style={{ color: 'var(--color-text-tertiary)' }} />
        <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
          {t('drag_hint')}{' '}
          <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{t('browse')}</span>
        </span>
        <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
          {t('format_hint')}
        </span>
        <input
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          onChange={onUpload}
          disabled={uploading}
          style={{ display: 'none' }}
        />
      </label>

      {docs.length > 0 && (
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {docs.map((doc, idx) => (
            <li
              key={`${doc.id ?? doc.fileUrl}-${idx}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                background: 'var(--color-bg-secondary)',
                borderRadius: 8,
              }}
            >
              <FileText size={20} style={{ color: 'var(--color-text-tertiary)' }} />
              <Input
                placeholder={t('title_placeholder')}
                value={doc.title ?? ''}
                onChange={(e) => updateTitle(idx, e.target.value)}
              />
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => removeDoc(idx)}
                aria-label="remove"
              >
                <Trash2 size={14} />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </StepShell>
  );
}
