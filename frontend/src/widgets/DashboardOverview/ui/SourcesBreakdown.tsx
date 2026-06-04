import { useTranslations } from 'next-intl';

import type { SourceStat } from '@/features/cabinet-analytics';

import styles from '../DashboardOverview.module.scss';

interface Props {
  data: SourceStat[];
}

const COLORS = ['#ee7c4e', '#3b82f6', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#64748b'];

function pickColor(source: string, index: number): string {
  const named: Record<string, string> = {
    direct: '#ee7c4e',
    search: '#3b82f6',
    google: '#3b82f6',
    yandex: '#ef4444',
    social: '#a855f7',
    instagram: '#a855f7',
    facebook: '#1e40af',
    telegram: '#0ea5e9',
    whatsapp: '#10b981',
    referral: '#0d9488',
    other: '#64748b',
  };
  const key = source.toLowerCase();
  return named[key] ?? COLORS[index % COLORS.length];
}

const SIZE = 160;
const STROKE = 22;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

export function SourcesBreakdown({ data }: Props) {
  const t = useTranslations('cabinet.dashboard');

  if (data.length === 0) {
    return (
      <section className={styles.card}>
        <h3 className={styles.cardTitle}>{t('sources_title')}</h3>
        <p className={styles.empty}>{t('sources_empty')}</p>
      </section>
    );
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);
  const segments = data.map((d, i) => ({ ...d, color: pickColor(d.source, i) }));

  let offset = 0;
  const arcs = segments.map((seg) => {
    const length = (seg.percent / 100) * CIRC;
    const node = (
      <circle
        key={seg.source}
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        fill="transparent"
        stroke={seg.color}
        strokeWidth={STROKE}
        strokeDasharray={`${length} ${CIRC - length}`}
        strokeDashoffset={-offset}
        transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
      />
    );
    offset += length;
    return node;
  });

  return (
    <section className={styles.card}>
      <h3 className={styles.cardTitle}>{t('sources_title')}</h3>
      <div className={styles.sourcesLayout}>
        <div className={styles.donutWrap}>
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            role="img"
            aria-label="Источники трафика"
          >
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="transparent"
              stroke="var(--color-bg-secondary)"
              strokeWidth={STROKE}
            />
            {arcs}
          </svg>
          <div className={styles.donutCenter}>
            <strong>{total}</strong>
            <span>{t('sources_total_label')}</span>
          </div>
        </div>

        <ul className={styles.sourcesLegend}>
          {segments.map((seg) => (
            <li key={seg.source} className={styles.sourceItem}>
              <span
                className={styles.sourceDot}
                style={{ background: seg.color }}
                aria-hidden
              />
              <span className={styles.sourceLabel}>{seg.source}</span>
              <span className={styles.sourcePercent}>{seg.percent.toFixed(0)}%</span>
              <span className={styles.sourceCount}>{seg.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
