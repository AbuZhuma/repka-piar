'use client';

import { FileText, Trash2, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { env } from '@/shared/config/env';
import { ApiError, apiDelete, apiGet } from '@/shared/lib/api';
import { auth } from '@/shared/lib/auth';
import { Button } from '@/shared/ui/Button';

import { SectionShell } from './SectionShell';

interface Doc {
  id: string;
  title?: string | null;
  file_url: string;
  file_type?: string | null;
  verified: boolean;
}

export function EditDocumentsSection() {
  const t = useTranslations('cabinet.profile_edit');
  const [docs, setDocs] = useState<Doc[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = async () => {
    try {
      const me = await apiGet<{ documents?: Doc[] }>('/api/tutors/me');
      setDocs(me.documents ?? []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('10 МБ max');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', file.name);
      const resp = await fetch(`${env.apiUrl}/api/tutors/me/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${auth.getAccess() ?? ''}` },
        body: fd,
      });
      if (!resp.ok) throw new Error('upload failed');
      const json: Doc = await resp.json();
      setDocs((prev) => [...prev, json]);
    } catch {
      setError(t('save_error'));
    } finally {
      setUploading(false);
    }
  };

  const onDelete = async (id: string) => {
    setError(null);
    try {
      await apiDelete(`/api/tutors/me/documents/${id}`);
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('save_error'));
    }
  };

  return (
    <SectionShell id="documents" title={t('section_documents')} hideSave error={error}>
      {docs.length > 0 && (
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {docs.map((doc) => (
            <li
              key={doc.id}
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
              <div style={{ flex: 1, minWidth: 0 }}>
                <a
                  href={doc.file_url.startsWith('http') ? doc.file_url : `${env.apiUrl}${doc.file_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 14,
                    color: 'var(--color-text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                  }}
                >
                  {doc.title ?? 'Документ'}
                </a>
                <span
                  style={{
                    fontSize: 12,
                    color: doc.verified ? 'var(--color-success)' : 'var(--color-text-tertiary)',
                  }}
                >
                  {doc.verified ? t('doc_verified') : t('doc_pending')}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => void onDelete(doc.id)}
                aria-label="remove"
              >
                <Trash2 size={14} />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        onChange={onUpload}
        style={{ display: 'none' }}
      />
      <Button
        variant="secondary"
        size="md"
        type="button"
        leftIcon={<Upload size={16} />}
        onClick={() => fileRef.current?.click()}
        loading={uploading}
      >
        {t('doc_upload')}
      </Button>
      <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{t('doc_format')}</span>
    </SectionShell>
  );
}
