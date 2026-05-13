'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { getMyTutorProfile, type MyTutorProfile } from '@/features/cabinet-analytics';
import {
  EditBasicSection,
  EditContactsSection,
  EditDocumentsSection,
  EditEducationSection,
  EditPhotoSection,
  EditPricesSection,
} from '@/features/profile-edit';
import { Skeleton } from '@/shared/ui/Skeleton';
import { ProfilePreview } from '@/widgets/ProfilePreview';

import { ProfileEditorProvider } from './EditorContext';
import styles from './ProfileEditor.module.scss';

const SECTION_LINKS = [
  { id: 'photo', key: 'section_photo' as const },
  { id: 'basic', key: 'section_basic' as const },
  { id: 'education', key: 'section_education' as const },
  { id: 'prices', key: 'section_prices' as const },
  { id: 'contacts', key: 'section_contacts' as const },
  { id: 'documents', key: 'section_documents' as const },
];

export function ProfileEditor() {
  const t = useTranslations('cabinet.profile_edit');
  const [profile, setProfile] = useState<MyTutorProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyTutorProfile()
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }
  if (!profile) {
    return (
      <div className={styles.layout}>
        <Skeleton height={400} />
      </div>
    );
  }

  return (
    <ProfileEditorProvider initial={profile}>
      <div className={styles.layout}>
        <aside className={styles.tocAside}>
          <nav className={styles.toc} aria-label="Sections">
            {SECTION_LINKS.map((s) => (
              <a key={s.id} href={`#${s.id}`} className={styles.tocItem}>
                {t(s.key)}
              </a>
            ))}
          </nav>
        </aside>

        <div className={styles.editorColumn}>
          <h1 className={styles.title}>{t('title')}</h1>
          <EditPhotoSection />
          <EditBasicSection />
          <EditEducationSection />
          <EditPricesSection />
          <EditContactsSection />
          <EditDocumentsSection />
        </div>

        <ProfilePreview />
      </div>
    </ProfileEditorProvider>
  );
}
