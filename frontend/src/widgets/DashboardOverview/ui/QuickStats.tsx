import { Award, Eye, Phone, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { DashboardResponse } from '@/features/cabinet-analytics';

import styles from '../DashboardOverview.module.scss';
import { StatCard } from './StatCard';

interface Props {
  overview: DashboardResponse['overview'];
}

export function QuickStats({ overview }: Props) {
  const t = useTranslations('cabinet.dashboard');
  return (
    <div className={styles.stats}>
      <StatCard
        icon={<Eye size={18} />}
        label={t('stats.views_label')}
        value={overview.views.current_period}
        trend={overview.views.change_percent}
      />
      <StatCard
        icon={<Phone size={18} />}
        label={t('stats.clicks_label')}
        value={overview.contact_clicks.current_period}
        trend={overview.contact_clicks.change_percent}
      />
      <StatCard
        icon={<TrendingUp size={18} />}
        label={t('stats.conversion_label')}
        value={`${overview.conversion.current_period.toFixed(1)}%`}
        trend={overview.conversion.change_percent}
      />
      <StatCard
        icon={<Award size={18} />}
        label={t('stats.position_label')}
        value={
          overview.current_position.rank
            ? t('stats.rank_value', {
                rank: overview.current_position.rank,
                total: overview.current_position.total,
              })
            : '—'
        }
        sublabel={overview.current_position.subject ?? t('stats.no_position')}
      />
    </div>
  );
}
