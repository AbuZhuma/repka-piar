import { TrendingDown, TrendingUp } from 'lucide-react';

import { cn } from '@/shared/lib/cn';

import styles from '../DashboardOverview.module.scss';

interface Props {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: number | null;
  sublabel?: string;
}

export function StatCard({ icon, label, value, trend, sublabel }: Props) {
  let trendNode: React.ReactNode = null;
  if (typeof trend === 'number' && Number.isFinite(trend)) {
    if (trend > 0) {
      trendNode = (
        <span className={cn(styles.trend, styles.trendUp)}>
          <TrendingUp size={12} /> +{trend.toFixed(1)}%
        </span>
      );
    } else if (trend < 0) {
      trendNode = (
        <span className={cn(styles.trend, styles.trendDown)}>
          <TrendingDown size={12} /> {trend.toFixed(1)}%
        </span>
      );
    } else {
      trendNode = <span className={styles.trend}>—</span>;
    }
  }

  return (
    <div className={styles.statCard}>
      <div className={styles.statHead}>
        <span className={styles.statIcon}>{icon}</span>
        <span className={styles.statLabel}>{label}</span>
      </div>
      <div className={styles.statValueRow}>
        <strong className={styles.statValue}>{value}</strong>
        {trendNode}
      </div>
      {sublabel && <span className={styles.statSub}>{sublabel}</span>}
    </div>
  );
}
