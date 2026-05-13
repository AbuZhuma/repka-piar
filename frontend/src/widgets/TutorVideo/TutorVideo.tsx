'use client';

import { Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Modal } from '@/shared/ui/Modal';

import styles from './TutorVideo.module.scss';

interface TutorVideoProps {
  url: string;
  poster?: string;
  externalOpen?: boolean;
  onCloseExternal?: () => void;
}

export function TutorVideo({ url, poster, externalOpen, onCloseExternal }: TutorVideoProps) {
  const t = useTranslations('tutor_profile');
  const [open, setOpen] = useState(false);
  const isOpen = externalOpen ?? open;
  const handleChange = (next: boolean) => {
    if (externalOpen !== undefined) {
      if (!next) onCloseExternal?.();
    } else {
      setOpen(next);
    }
  };

  return (
    <section id="video" className={styles.section}>
      <h2 className={styles.heading}>{t('sections.video')}</h2>
      <button type="button" className={styles.thumb} onClick={() => handleChange(true)}>
        {poster && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" className={styles.poster} />
        )}
        <span className={styles.playOverlay} aria-hidden>
          <Play size={28} fill="currentColor" />
        </span>
        <span className={styles.label}>{t('video_open')}</span>
      </button>

      <Modal open={isOpen} onOpenChange={handleChange} size="lg" title={t('sections.video')}>
        <video src={url} controls autoPlay playsInline className={styles.video} />
      </Modal>
    </section>
  );
}
