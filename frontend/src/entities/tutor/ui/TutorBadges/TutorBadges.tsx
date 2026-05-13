import { useTranslations } from 'next-intl';

import { cn } from '@/shared/lib/cn';

import styles from './TutorBadges.module.scss';

const BADGE_PRIORITY = [
  'top',
  'native',
  'verified',
  'experienced',
  'popular',
  'exam_ort',
  'exam_ielts',
  'exam_toefl',
  'exam_sat',
  'new',
];

const BADGE_TONE: Record<string, string> = {
  top: 'gold',
  native: 'blue',
  verified: 'green',
  experienced: 'gray',
  popular: 'gold',
  exam_ort: 'green',
  exam_ielts: 'green',
  exam_toefl: 'green',
  exam_sat: 'green',
  new: 'gray',
};

interface TutorBadgesProps {
  badges: string[];
  max?: number;
  className?: string;
}

export function TutorBadges({ badges, max = 2, className }: TutorBadgesProps) {
  const t = useTranslations('badges');

  const sorted = [...badges].sort((a, b) => {
    const ia = BADGE_PRIORITY.indexOf(a);
    const ib = BADGE_PRIORITY.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
  const visible = sorted.slice(0, max);
  if (visible.length === 0) return null;

  return (
    <div className={cn(styles.badges, className)}>
      {visible.map((badge) => {
        const tone = BADGE_TONE[badge] ?? 'gray';
        let label: string;
        try {
          label = t(badge as never);
        } catch {
          label = badge;
        }
        return (
          <span key={badge} className={cn(styles.badge, styles[`tone_${tone}`])}>
            {label}
          </span>
        );
      })}
    </div>
  );
}
