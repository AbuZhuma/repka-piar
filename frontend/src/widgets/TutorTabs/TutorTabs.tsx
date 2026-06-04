'use client';

import { useTranslations } from 'next-intl';

import styles from './TutorTabs.module.scss';

interface TutorTabsProps {
  hasVideo: boolean;
}

const SCROLL_OFFSET = 88;

export function TutorTabs({ hasVideo }: TutorTabsProps) {
  const t = useTranslations('tutor_profile.tabs');
  const tabs = [
    { id: 'about', label: t('about') },
    { id: 'prices', label: t('prices') },
    ...(hasVideo ? [{ id: 'video', label: t('video') }] : []),
  ];

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (typeof window === 'undefined') return;
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    window.scrollTo({ top, behavior: 'smooth' });
    history.replaceState(null, '', `#${id}`);
  };

  return (
    <nav className={styles.tabs}>
      {tabs.map((tab) => (
        <a
          key={tab.id}
          href={`#${tab.id}`}
          onClick={(e) => onClick(e, tab.id)}
          className={styles.tab}
        >
          {tab.label}
        </a>
      ))}
    </nav>
  );
}
