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
  ProfileEditorProvider,
} from '@/features/profile-edit';
import { cn } from '@/shared/lib/cn';
import { Skeleton } from '@/shared/ui/Skeleton';
import { ProfilePreview } from '@/widgets/ProfilePreview';

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
  const [activeId, setActiveId] = useState<string>(SECTION_LINKS[0].id);

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

  useEffect(() => {
    if (!profile) return;
    const targets = SECTION_LINKS
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (targets.length === 0) return;

    const visibility = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibility.set(entry.target.id, entry.intersectionRatio);
        }
        let bestId = activeId;
        let bestRatio = -1;
        for (const [id, ratio] of visibility) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        }
        if (bestRatio > 0) setActiveId(bestId);
      },
      {
        rootMargin: '-96px 0px -55% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const onTocClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setActiveId(id);
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 88;
      window.scrollTo({ top, behavior: 'smooth' });
      history.replaceState(null, '', `#${id}`);
    }
  };

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
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={(e) => onTocClick(e, s.id)}
                aria-current={activeId === s.id ? 'true' : undefined}
                className={cn(styles.tocItem, activeId === s.id && styles.tocItemActive)}
              >
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
