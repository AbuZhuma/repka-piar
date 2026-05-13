import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/routing';
import { Container } from '@/shared/ui/Container';

import styles from './ExamTiles.module.scss';

const TILES = [
  { key: 'ort', href: '/catalog?goal=exam_ort', tone: 'green', emoji: '🎓' },
  { key: 'ege', href: '/catalog?goal=exam_ege', tone: 'blue', emoji: '📘' },
  { key: 'ielts_toefl', href: '/catalog?goal=exam_ielts', tone: 'purple', emoji: '🌍' },
  { key: 'sat', href: '/catalog?goal=exam_sat', tone: 'orange', emoji: '🇺🇸' },
] as const;

export function ExamTiles() {
  const t = useTranslations('exams');
  const tHome = useTranslations('homepage');

  return (
    <section className={styles.section}>
      <Container>
        <h2 className={styles.title}>{tHome('exams_title')}</h2>
        <div className={styles.grid}>
          {TILES.map((tile) => (
            <Link
              key={tile.key}
              href={tile.href}
              className={`${styles.tile} ${styles[`tone_${tile.tone}`]}`}
            >
              <span className={styles.emoji} aria-hidden>
                {tile.emoji}
              </span>
              <span className={styles.tileBody}>
                <span className={styles.tileTitle}>{t(`${tile.key}_title`)}</span>
                <span className={styles.tileSubtitle}>{t(`${tile.key}_subtitle`)}</span>
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
