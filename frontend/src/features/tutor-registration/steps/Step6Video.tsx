'use client';

import { Video } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { FILE_LIMITS, FILE_LIMITS_MB } from '@/shared/config/constants';

import { StepShell } from '../StepShell';
import { useRegistrationStore } from '../useRegistrationStore';

export function Step6Video() {
  const t = useTranslations('register.step6');
  const tErrors = useTranslations('auth.errors');
  const update = useRegistrationStore((s) => s.update);
  const next = useRegistrationStore((s) => s.next);
  const stored = useRegistrationStore((s) => s.videoUrl);

  const [videoUrl, setVideoUrl] = useState<string | undefined>(stored);
  const [error, setError] = useState<string | null>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > FILE_LIMITS.video) {
      setError(tErrors('file_too_large', { mb: FILE_LIMITS_MB.video }));
      return;
    }
    // Phase 1: keep an in-memory blob URL — no backend endpoint yet
    const blob = URL.createObjectURL(file);
    setVideoUrl(blob);
    setError(null);
  };

  const onNext = () => {
    update({ videoUrl });
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
      <p
        style={{
          background: 'var(--color-primary-light)',
          color: 'var(--color-primary)',
          padding: 12,
          borderRadius: 8,
          fontSize: 14,
        }}
      >
        💡 {t('tip')}
      </p>

      <label
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          padding: 24,
          border: '2px dashed var(--color-border-primary)',
          borderRadius: 12,
          cursor: 'pointer',
          background: 'var(--color-bg-secondary)',
        }}
      >
        <Video size={28} style={{ color: 'var(--color-text-tertiary)' }} />
        <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
          {t('upload_label')}
        </span>
        <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
          {t('format_hint')}
        </span>
        <input
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          onChange={onFile}
          style={{ display: 'none' }}
        />
      </label>

      {videoUrl && /^(blob:|https?:|data:)/.test(videoUrl) && (
        <video
          src={videoUrl}
          controls
          style={{ width: '100%', borderRadius: 8, background: 'black' }}
          onError={() => setVideoUrl(undefined)}
        />
      )}

      <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{t('skip_note')}</p>
    </StepShell>
  );
}
