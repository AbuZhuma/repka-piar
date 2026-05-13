'use client';

import { useEffect, useState } from 'react';

import {
  adminFullAnalytics,
  type FullAnalytics,
  type TimeSeriesPoint,
} from '@/shared/api/admin';
import { Link } from '@/i18n/routing';
import { assetUrl } from '@/shared/lib/format';

import styles from './page.module.scss';

export default function AnalyticsPage() {
  const [data, setData] = useState<FullAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFullAnalytics()
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Не удалось'));
  }, []);

  if (error) return <div className={styles.error}>{error}</div>;
  if (!data) return <div className={styles.loading}>Загрузка…</div>;

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.title}>Аналитика</h1>
        <p className={styles.subtitle}>Сводные метрики платформы за всё время и за 30 дней</p>
      </header>

      <div className={styles.totals}>
        <Stat label="Всего пользователей" value={data.totals.users_total} />
        <Stat
          label="Репетиторов"
          value={data.totals.tutors_total}
          sub={`Активных: ${data.totals.tutors_active}`}
        />
        <Stat label="Просмотров профилей" value={data.totals.views_total} />
        <Stat
          label="Кликов на контакты"
          value={data.totals.clicks_total}
          sub={
            data.totals.views_total > 0
              ? `${((data.totals.clicks_total / data.totals.views_total) * 100).toFixed(1)}% от просмотров`
              : undefined
          }
        />
        <Stat label="Опубликованных статей" value={data.totals.posts_published} />
        <Stat label="Просмотров статей" value={data.totals.post_views_total} />
      </div>

      <div className={styles.charts}>
        <SeriesCard title="Просмотры профилей (30 дней)" series={data.views_30d} />
        <SeriesCard title="Клики на контакты (30 дней)" series={data.clicks_30d} />
        <SeriesCard title="Регистрации (30 дней)" series={data.signups_30d} />
      </div>

      <div className={styles.twoCol}>
        <section className={styles.card}>
          <h3 className={styles.sectionTitle}>Топ репетиторов по просмотрам</h3>
          {data.top_tutors.length === 0 ? (
            <p className={styles.empty}>Нет данных</p>
          ) : (
            <ol className={styles.topList}>
              {data.top_tutors.map((t) => (
                <li key={t.id}>
                  {t.photo_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={assetUrl(t.photo_url) ?? t.photo_url}
                      alt=""
                      className={styles.avatar}
                    />
                  ) : (
                    <span className={styles.avatarFallback}>
                      {(t.name[0] ?? '').toUpperCase()}
                    </span>
                  )}
                  <Link
                    href={`/admin/tutors/${t.id}`}
                    className={styles.topName}
                  >
                    {t.name} {t.surname}
                  </Link>
                  <span className={styles.muted}>
                    {t.views_count} просмотров · {t.contact_clicks_count} кликов
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className={styles.card}>
          <h3 className={styles.sectionTitle}>Топ статей</h3>
          {data.top_posts.length === 0 ? (
            <p className={styles.empty}>Нет данных</p>
          ) : (
            <ol className={styles.topList}>
              {data.top_posts.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/posts/${p.id}/edit`}
                    className={styles.topName}
                  >
                    {p.title_ru}
                  </Link>
                  <span className={styles.muted}>
                    {p.views_count} просмотров · {p.likes_count} лайков
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <div className={styles.twoCol}>
        <DistributionCard
          title="Распределение по предметам"
          rows={data.distribution_by_subject}
          unit="репетиторов"
        />
        <DistributionCard
          title="Распределение по городам"
          rows={data.distribution_by_city}
          unit="репетиторов"
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value.toLocaleString('ru-RU')}</span>
      {sub && <span className={styles.statSub}>{sub}</span>}
    </div>
  );
}

function SeriesCard({ title, series }: { title: string; series: TimeSeriesPoint[] }) {
  const max = series.reduce((m, p) => Math.max(m, p.count), 0);
  const total = series.reduce((s, p) => s + p.count, 0);
  return (
    <div className={styles.card}>
      <header className={styles.cardHead}>
        <h3 className={styles.sectionTitle}>{title}</h3>
        <span className={styles.muted}>Σ {total.toLocaleString('ru-RU')}</span>
      </header>
      {series.length === 0 ? (
        <p className={styles.empty}>Нет данных за период</p>
      ) : (
        <div className={styles.bars}>
          {series.map((p) => (
            <div key={p.day} className={styles.bar} title={`${p.day}: ${p.count}`}>
              <span
                className={styles.barFill}
                style={{ height: `${max > 0 ? (p.count / max) * 100 : 0}%` }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DistributionCard({
  title,
  rows,
  unit,
}: {
  title: string;
  rows: { slug: string; name_ru: string; count: number }[];
  unit: string;
}) {
  const max = rows.reduce((m, r) => Math.max(m, r.count), 0);
  return (
    <div className={styles.card}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {rows.length === 0 ? (
        <p className={styles.empty}>Нет данных</p>
      ) : (
        <ul className={styles.distribution}>
          {rows.map((r) => (
            <li key={r.slug}>
              <span className={styles.distName}>{r.name_ru}</span>
              <span className={styles.distBar}>
                <span
                  className={styles.distFill}
                  style={{ width: `${max > 0 ? (r.count / max) * 100 : 0}%` }}
                />
              </span>
              <span className={styles.distCount}>
                {r.count} {unit}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
