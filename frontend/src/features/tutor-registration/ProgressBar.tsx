'use client';

import { useTranslations } from 'next-intl';

import styles from './ProgressBar.module.scss';

interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const t = useTranslations('register');
  const percent = Math.min((current / total) * 100, 100);
  return (
    <div className={styles.bar}>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${percent}%` }} />
      </div>
      <span className={styles.label}>{t('step_label', { current, total })}</span>
    </div>
  );
}
