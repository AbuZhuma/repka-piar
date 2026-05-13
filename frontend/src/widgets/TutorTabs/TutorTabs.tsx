'use client';

import { useTranslations } from 'next-intl';

import styles from './TutorTabs.module.scss';

interface TutorTabsProps {
  hasVideo: boolean;
}

export function TutorTabs({ hasVideo }: TutorTabsProps) {
  const t = useTranslations('tutor_profile.tabs');
  const tabs = [
    { href: '#about', label: t('about') },
    { href: '#prices', label: t('prices') },
    ...(hasVideo ? [{ href: '#video', label: t('video') }] : []),
  ];
  return (
    <nav className={styles.tabs}>
      {tabs.map((tab) => (
        <a key={tab.href} href={tab.href} className={styles.tab}>
          {tab.label}
        </a>
      ))}
    </nav>
  );
}
