'use client';

import {
  Award,
  Eye,
  Instagram,
  Mail,
  MessageCircle,
  Phone,
  Send,
  TrendingDown,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { useAuth } from '@/features/auth';
import {
  type ChannelStat,
  type DashboardResponse,
  type DayCount,
  type SourceStat,
  getDashboard,
} from '@/features/cabinet-analytics';
import { Link } from '@/i18n/routing';
import { cn } from '@/shared/lib/cn';
import { Skeleton } from '@/shared/ui/Skeleton';

import styles from './DashboardOverview.module.scss';

const EDIT_LINKS: Record<string, string> = {
  photo: '/cabinet/profile-page#photo',
  video: '/cabinet/profile-page#video',
  bio: '/cabinet/profile-page#basic',
  prices: '/cabinet/profile-page#prices',
  contacts: '/cabinet/profile-page#contacts',
  education: '/cabinet/profile-page#education',
};

function ChannelIcon({ channel }: { channel: string }) {
  const props = { size: 16 };
  if (channel === 'phone') return <Phone {...props} />;
  if (channel === 'whatsapp') return <MessageCircle {...props} />;
  if (channel === 'telegram') return <Send {...props} />;
  if (channel === 'email') return <Mail {...props} />;
  if (channel === 'instagram') return <Instagram {...props} />;
  return <Phone {...props} />;
}

export function DashboardOverview() {
  const t = useTranslations('cabinet.dashboard');
  const tVerify = useTranslations('cabinet.verification');
  const tChannels = useTranslations('tutor_contacts.channels');
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

  const { overview, profile_completeness, views_chart, contacts_by_channel, sources, recent_events } =
    data;
  const weekViews = views_chart.slice(-7).reduce((s, d) => s + d.count, 0);

  const subtitle =
    data.verification_status === 'pending' || data.verification_status === 'pending_review'
      ? t('subtitle_pending')
      : weekViews > 0
        ? t('subtitle_views', { count: weekViews })
        : t('subtitle_empty');

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('greeting', { name: user?.name ?? '' })}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </header>

      <VerificationBanner
        status={data.verification_status}
        rejectionReason={data.rejection_reason}
        t={tVerify}
      />

      <QuickStats t={t} overview={overview} />

      {profile_completeness.percent < 100 && (
        <ChecklistCard t={t} completeness={profile_completeness} />
      )}

      <div className={styles.grid}>
        <ViewsChart t={t} data={views_chart} />
        <ContactsBreakdown
          t={t}
          tChannels={tChannels}
          data={contacts_by_channel}
        />
      </div>

      <SourcesBreakdown t={t} data={sources} />
      <EventsFeed t={t} events={recent_events} />
    </div>
  );
}

function VerificationBanner({
  status,
  rejectionReason,
  t,
}: {
  status: string;
  rejectionReason?: string | null;
  t: ReturnType<typeof useTranslations>;
}) {
  if (status === 'active') return null;
  const isPending = status === 'pending' || status === 'pending_review';
  const isRejected = status === 'rejected';
  return (
    <div
      className={cn(
        styles.banner,
        isPending && styles.bannerPending,
        isRejected && styles.bannerError,
      )}
    >
      <strong>{t(isRejected ? 'rejected_title' : 'pending_title')}</strong>
      <p>
        {isRejected
          ? t('rejected_text', { reason: rejectionReason ?? '—' })
          : t('pending_text')}
      </p>
    </div>
  );
}

function QuickStats({
  t,
  overview,
}: {
  t: ReturnType<typeof useTranslations>;
  overview: DashboardResponse['overview'];
}) {
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

function StatCard({
  icon,
  label,
  value,
  trend,
  sublabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: number | null;
  sublabel?: string;
}) {
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

function ChecklistCard({
  t,
  completeness,
}: {
  t: ReturnType<typeof useTranslations>;
  completeness: DashboardResponse['profile_completeness'];
}) {
  return (
    <section className={styles.card}>
      <header className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{t('checklist_title')}</h2>
        <span className={styles.percent}>{completeness.percent}%</span>
      </header>
      <div className={styles.progressTrack}>
        <div
          className={styles.progressFill}
          style={{ width: `${completeness.percent}%` }}
        />
      </div>
      <p className={styles.cardHint}>{t('checklist_hint')}</p>
      <ul className={styles.checklist}>
        {completeness.checklist.map((item) => (
          <li
            key={item.id}
            className={cn(styles.checkItem, item.completed && styles.checkItemDone)}
          >
            <span className={styles.checkBox}>{item.completed ? '✓' : '○'}</span>
            <Link href={EDIT_LINKS[item.id] ?? '/cabinet/profile-page'} className={styles.checkLabel}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ViewsChart({
  t,
  data,
}: {
  t: ReturnType<typeof useTranslations>;
  data: DayCount[];
}) {
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

function ContactsBreakdown({
  t,
  tChannels,
  data,
}: {
  t: ReturnType<typeof useTranslations>;
  tChannels: ReturnType<typeof useTranslations>;
  data: ChannelStat[];
}) {
  return (
    <section className={styles.card}>
      <h3 className={styles.cardTitle}>{t('channels_title')}</h3>
      {data.length === 0 ? (
        <p className={styles.empty}>{t('channels_empty')}</p>
      ) : (
        <ul className={styles.channelList}>
          {data.map((it) => {
            let label = it.channel;
            try {
              label = tChannels(it.channel as never);
            } catch {
              // ignore
            }
            return (
              <li key={it.channel} className={styles.channelRow}>
                <span className={styles.channelIcon}>
                  <ChannelIcon channel={it.channel} />
                </span>
                <span className={styles.channelLabel}>{label}</span>
                <span className={styles.channelTrack}>
                  <span className={styles.channelFill} style={{ width: `${it.percent}%` }} />
                </span>
                <span className={styles.channelValue}>
                  {it.count} ({it.percent.toFixed(0)}%)
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function SourcesBreakdown({
  t,
  data,
}: {
  t: ReturnType<typeof useTranslations>;
  data: SourceStat[];
}) {
  return (
    <section className={styles.card}>
      <h3 className={styles.cardTitle}>{t('sources_title')}</h3>
      {data.length === 0 ? (
        <p className={styles.empty}>{t('sources_empty')}</p>
      ) : (
        <ul className={styles.channelList}>
          {data.map((it) => (
            <li key={it.source} className={styles.channelRow}>
              <span className={styles.channelLabel}>{it.source}</span>
              <span className={styles.channelTrack}>
                <span className={styles.channelFill} style={{ width: `${it.percent}%` }} />
              </span>
              <span className={styles.channelValue}>
                {it.count} ({it.percent.toFixed(0)}%)
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function EventsFeed({
  t,
  events,
}: {
  t: ReturnType<typeof useTranslations>;
  events: DashboardResponse['recent_events'];
}) {
  return (
    <section className={styles.card}>
      <h3 className={styles.cardTitle}>{t('events_title')}</h3>
      {events.length === 0 ? (
        <p className={styles.empty}>{t('events_empty')}</p>
      ) : (
        <ul className={styles.events}>
          {events.map((ev, i) => (
            <li key={`${ev.type}-${i}`} className={styles.eventItem}>
              <span className={styles.eventIcon}>
                <Sparkles size={16} />
              </span>
              <p className={styles.eventMessage}>{ev.message}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DashboardSkeleton() {
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
