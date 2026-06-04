import { useTranslations } from 'next-intl';

import type { ChannelStat } from '@/features/cabinet-analytics';

import styles from '../DashboardOverview.module.scss';
import { ChannelIcon } from './ChannelIcon';

interface Props {
  data: ChannelStat[];
}

export function ContactsBreakdown({ data }: Props) {
  const t = useTranslations('cabinet.dashboard');
  const tChannels = useTranslations('tutor_contacts.channels');
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
              // unknown channel — fall back to raw value
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
