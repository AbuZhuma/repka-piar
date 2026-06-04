import { useTranslations } from 'next-intl';

import type { DayCount } from '@/features/cabinet-analytics';

import styles from '../DashboardOverview.module.scss';

interface Props {
  data: DayCount[];
}

export function ViewsChart({ data }: Props) {
  const t = useTranslations('cabinet.dashboard');
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <section className={styles.card}>
      <h3 className={styles.cardTitle}>{t('views_chart_title')}</h3>
      <div className={styles.chart}>
        {data.map((d) => {
          const h = (d.count / max) * 100;
          return (
            <div key={d.date} className={styles.bar}>
              <span
                className={styles.barFill}
                style={{ height: `${Math.max(h, 2)}%` }}
                title={`${d.date}: ${d.count}`}
              />
            </div>
          );
        })}
      </div>
      <p className={styles.cardHint}>{t('views_chart_total', { count: total })}</p>
    </section>
  );
}
