'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { useAuth } from '@/features/auth';
import { type DashboardResponse, getDashboard } from '@/features/cabinet-analytics';
import { assetUrl } from '@/shared/lib/format';

import styles from './DashboardOverview.module.scss';
import { ChecklistCard } from './ui/ChecklistCard';
import { ContactsBreakdown } from './ui/ContactsBreakdown';
import { DashboardSkeleton } from './ui/DashboardSkeleton';
import { EventsFeed } from './ui/EventsFeed';
import { QuickStats } from './ui/QuickStats';
import { SourcesBreakdown } from './ui/SourcesBreakdown';
import { VerificationBanner } from './ui/VerificationBanner';
import { ViewsChart } from './ui/ViewsChart';

export function DashboardOverview() {
  const t = useTranslations('cabinet.dashboard');
  const { user } = useAuth();

  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDashboard()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className={styles.errorBox}>
        <p>{error}</p>
      </div>
    );
  }

  if (!data) {
    return <DashboardSkeleton />;
  }

  const {
    overview,
    profile_completeness,
    views_chart,
    contacts_by_channel,
    sources,
    recent_events,
  } = data;
  const weekViews = views_chart.slice(-7).reduce((s, d) => s + d.count, 0);

  const subtitle =
    data.verification_status === 'pending' || data.verification_status === 'pending_review'
      ? t('subtitle_pending')
      : weekViews > 0
        ? t('subtitle_views', { count: weekViews })
        : t('subtitle_empty');

  const avatarSrc = user?.avatar_url
    ? assetUrl(user.avatar_url) ?? user.avatar_url
    : null;
  const initials = user
    ? `${(user.name?.[0] ?? '').toUpperCase()}${(user.surname?.[0] ?? '').toUpperCase()}` ||
      '?'
    : '?';

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <span className={styles.headerAvatar} aria-hidden>
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarSrc} alt="" />
          ) : (
            <span className={styles.headerInitials}>{initials}</span>
          )}
        </span>
        <div className={styles.headerText}>
          <h1 className={styles.title}>{t('greeting', { name: user?.name ?? '' })}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      </header>

      <VerificationBanner
        status={data.verification_status}
        rejectionReason={data.rejection_reason}
      />

      <QuickStats overview={overview} />

      {profile_completeness.percent < 100 && (
        <ChecklistCard completeness={profile_completeness} />
      )}

      <div className={styles.grid}>
        <ViewsChart data={views_chart} />
        <ContactsBreakdown data={contacts_by_channel} />
      </div>

      <SourcesBreakdown data={sources} />
      <EventsFeed events={recent_events} />
    </div>
  );
}
