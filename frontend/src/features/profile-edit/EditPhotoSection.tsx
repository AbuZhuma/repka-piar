'use client';

import { Camera, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import { useEditor } from '@/widgets/ProfileEditor/EditorContext';
import { Button } from '@/shared/ui/Button';
import { env } from '@/shared/config/env';
import { auth } from '@/shared/lib/auth';

import { SectionShell } from './SectionShell';
import styles from './EditPhotoSection.module.scss';

export function EditPhotoSection() {
  const t = useTranslations('cabinet.profile_edit');
  const { profile, setProfile } = useEditor();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('5 МБ max');
      return;
    }
    setUploading(true);
    setError(null);
    setSaved(false);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const resp = await fetch(`${env.apiUrl}/api/tutors/me/photo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${auth.getAccess() ?? ''}` },
        body: fd,
      });
      if (!resp.ok) throw new Error('upload failed');
      const json: { url: string } = await resp.json();
      setProfile((prev) => ({ ...prev, photo_url: json.url }));
      setSaved(true);
    } catch {
      setError(t('save_error'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <SectionShell id="photo" title={t('section_photo')} hideSave saved={saved} error={error}>
      <div className={styles.row}>
        <div className={styles.preview}>
          {profile.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={
                profile.photo_url.startsWith('http')
                  ? profile.photo_url
                  : `${env.apiUrl}${profile.photo_url}`
              }
              alt={`${profile.name}`}
              className={styles.photo}
            />
          ) : (
            <div className={styles.placeholder}>
              <User size={48} />
            </div>
          )}
        </div>
        <div className={styles.controls}>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onFile}
            style={{ display: 'none' }}
          />
          <Button
            type="button"
            variant="primary"
            size="md"
            leftIcon={<Camera size={16} />}
            onClick={() => fileRef.current?.click()}
            loading={uploading}
          >
            {profile.photo_url ? t('photo_change') : t('photo_upload')}
          </Button>
          <span className={styles.hint}>{t('photo_format')}</span>
        </div>
      </div>
    </SectionShell>
  );
}
