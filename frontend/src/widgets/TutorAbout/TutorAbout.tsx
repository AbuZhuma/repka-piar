'use client';

import { Briefcase, FileText, GraduationCap, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import type { TutorFull } from '@/entities/tutor/model/types';
import { assetUrl } from '@/shared/lib/format';

import styles from './TutorAbout.module.scss';

interface TutorAboutProps {
  tutor: TutorFull;
}

const BIO_PREVIEW_LIMIT = 320;

export function TutorAbout({ tutor }: TutorAboutProps) {
  const t = useTranslations('tutor_profile');
  const tAge = useTranslations('age_groups');
  const tLang = useTranslations('languages');
  const [bioExpanded, setBioExpanded] = useState(false);

  const bio = tutor.bio ?? tutor.short_bio ?? '';
  const isLong = bio.length > BIO_PREVIEW_LIMIT;
  const bioVisible = bioExpanded || !isLong ? bio : `${bio.slice(0, BIO_PREVIEW_LIMIT)}…`;

  return (
    <section id="about" className={styles.section}>
      {bio && (
        <div>
          <h2 className={styles.heading}>{t('sections.about')}</h2>
          <p className={styles.bio}>{bioVisible}</p>
          {isLong && (
            <button
              type="button"
              className={styles.toggle}
              onClick={() => setBioExpanded((v) => !v)}
            >
              {bioExpanded ? t('collapse') : t('expand')}
            </button>
          )}
        </div>
      )}

      {tutor.education.length > 0 && (
        <div>
          <h2 className={styles.heading}>
            {t('sections.education')}
          </h2>
          <ul className={styles.list}>
            {tutor.education.map((e) => (
              <li key={e.id} className={styles.entry}>
                <strong>{e.institution}</strong>
                {e.specialty && <span className={styles.entryMeta}> · {e.specialty}</span>}
                {(e.year_start || e.year_end) && (
                  <span className={styles.entryYears}>
                    {e.year_start ?? '?'}{' '}
                    — {e.year_end ?? t('until_now')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tutor.experience.length > 0 && (
        <div>
          <h2 className={styles.heading}>
            <Briefcase size={20} /> {t('sections.experience')}
          </h2>
          <ul className={styles.list}>
            {tutor.experience.map((e) => (
              <li key={e.id} className={styles.entry}>
                <strong>{e.position}</strong>
                {e.company && <span className={styles.entryMeta}> · {e.company}</span>}
                {(e.year_start || e.year_end) && (
                  <span className={styles.entryYears}>
                    {e.year_start ?? '?'} — {e.year_end ?? t('until_now')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tutor.documents.length > 0 && (
        <div>
          <h2 className={styles.heading}>
            <FileText size={20} /> {t('sections.documents')}
          </h2>
          <ul className={styles.docs}>
            {tutor.documents.map((doc) => (
              <li key={doc.id} className={styles.doc}>
                <a href={assetUrl(doc.file_url) ?? doc.file_url} target="_blank" rel="noopener noreferrer">
                  {doc.file_type?.startsWith('image/') ? (
                    <Image
                      src={assetUrl(doc.file_url) ?? doc.file_url}
                      alt={doc.title ?? 'document'}
                      width={200}
                      height={140}
                      className={styles.docPreview}
                      unoptimized
                    />
                  ) : (
                    <div className={styles.docPlaceholder} aria-hidden>
                      <FileText size={32} />
                    </div>
                  )}
                  <span className={styles.docTitle}>{doc.title ?? 'Документ'}</span>
                </a>
                {doc.verified && (
                  <span className={styles.verified}>
                    <ShieldCheck size={12} /> {t('verified_doc')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tutor.languages.length > 0 && (
        <div>
          <h2 className={styles.heading}>{t('sections.languages')}</h2>
          <ul className={styles.tags}>
            {tutor.languages.map((l) => (
              <li key={l.language_code} className={styles.tag}>
                {tLang(l.language_code as never)}
                {l.level && <span className={styles.level}> · {l.level}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tutor.specializations.length > 0 && (
        <div>
          <h2 className={styles.heading}>{t('sections.specializations')}</h2>
          <ul className={styles.tags}>
            {tutor.specializations.map((s) => (
              <li key={s} className={styles.tag}>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tutor.age_groups.length > 0 && (
        <div>
          <h2 className={styles.heading}>{t('sections.age_groups')}</h2>
          <ul className={styles.tags}>
            {tutor.age_groups.map((ag) => {
              let label = ag;
              try {
                label = tAge(ag as never);
              } catch {
                label = ag;
              }
              return (
                <li key={ag} className={styles.tag}>
                  {label}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
