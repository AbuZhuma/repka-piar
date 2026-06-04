import { Skeleton } from '@/shared/ui/Skeleton';

import styles from '../DashboardOverview.module.scss';

export function DashboardSkeleton() {
  return (
    <div className={styles.dashboard}>
      <Skeleton width="40%" height={28} />
      <div className={styles.stats}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={styles.statCard}>
            <Skeleton width="60%" height={12} />
            <Skeleton width="40%" height={28} />
          </div>
        ))}
      </div>
      <Skeleton height={200} />
      <Skeleton height={200} />
    </div>
  );
}
