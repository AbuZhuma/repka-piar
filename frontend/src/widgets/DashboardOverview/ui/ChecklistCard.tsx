import { useTranslations } from 'next-intl';

import type { DashboardResponse } from '@/features/cabinet-analytics';
import { Link } from '@/i18n/routing';
import { cn } from '@/shared/lib/cn';

import styles from '../DashboardOverview.module.scss';
import { getEditLink } from '../lib/editLinks';

interface Props {
  completeness: DashboardResponse['profile_completeness'];
}

export function ChecklistCard({ completeness }: Props) {
  const t = useTranslations('cabinet.dashboard');
  return (
    <section className={styles.card}>
      <header className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{t('checklist_title')}</h2>
        <span className={styles.percent}>{completeness.percent}%</span>
      </header>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${completeness.percent}%` }} />
      </div>
      <p className={styles.cardHint}>{t('checklist_hint')}</p>
      <ul className={styles.checklist}>
        {completeness.checklist.map((item) => (
          <li
            key={item.id}
            className={cn(styles.checkItem, item.completed && styles.checkItemDone)}
          >
            <span className={styles.checkBox}>{item.completed ? '✓' : '○'}</span>
            <Link href={getEditLink(item.id)} className={styles.checkLabel}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
