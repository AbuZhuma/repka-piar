import { Eye, Phone, Sparkles, Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { DashboardResponse } from '@/features/cabinet-analytics';

import styles from '../DashboardOverview.module.scss';

interface Props {
  events: DashboardResponse['recent_events'];
}

interface EventStyle {
  icon: React.ReactNode;
  toneClass: string;
}

function styleFor(type: string): EventStyle {
  switch (type) {
    case 'views_milestone':
      return { icon: <Eye size={18} />, toneClass: styles.eventToneViews };
    case 'contact_click':
      return { icon: <Phone size={18} />, toneClass: styles.eventToneClicks };
    case 'rank_position':
      return { icon: <Trophy size={18} />, toneClass: styles.eventToneRank };
    default:
      return { icon: <Sparkles size={18} />, toneClass: styles.eventToneDefault };
  }
}

function extractHighlight(message: string): { lead: string | null; rest: string } {
  const match = message.match(/^(\d[\d\s]*)\s+(.+)$/);
  if (!match) return { lead: null, rest: message };
  return { lead: match[1], rest: match[2] };
}

export function EventsFeed({ events }: Props) {
  const t = useTranslations('cabinet.dashboard');

  return (
    <section className={styles.card}>
      <h3 className={styles.cardTitle}>{t('events_title')}</h3>
      {events.length === 0 ? (
        <p className={styles.empty}>{t('events_empty')}</p>
      ) : (
        <ul className={styles.eventsGrid}>
          {events.map((ev, i) => {
            const s = styleFor(ev.type);
            const { lead, rest } = extractHighlight(ev.message);
            return (
              <li key={`${ev.type}-${i}`} className={styles.eventCard}>
                <span className={`${styles.eventIconLg} ${s.toneClass}`}>{s.icon}</span>
                <div className={styles.eventBody}>
                  {lead && <strong className={styles.eventLead}>{lead}</strong>}
                  <p className={styles.eventMessage}>{rest}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
