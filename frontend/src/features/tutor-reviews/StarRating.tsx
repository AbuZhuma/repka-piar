'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/shared/lib/cn';

import styles from './StarRating.module.scss';

interface Props {
  value: number;
  onChange?: (next: number) => void;
  size?: number;
  readOnly?: boolean;
  ariaLabel?: string;
}

export function StarRating({
  value,
  onChange,
  size = 24,
  readOnly = false,
  ariaLabel = 'Оценка',
}: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const effective = hover ?? value;

  return (
    <div className={cn(styles.row, readOnly && styles.readOnly)} aria-label={ariaLabel}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= effective;
        return (
          <button
            key={i}
            type="button"
            disabled={readOnly}
            className={cn(styles.star, filled && styles.filled)}
            onMouseEnter={readOnly ? undefined : () => setHover(i)}
            onMouseLeave={readOnly ? undefined : () => setHover(null)}
            onFocus={readOnly ? undefined : () => setHover(i)}
            onBlur={readOnly ? undefined : () => setHover(null)}
            onClick={readOnly ? undefined : () => onChange?.(i)}
            aria-label={`${i} ${i === 1 ? 'звезда' : 'звёзд'}`}
          >
            <Star size={size} fill={filled ? 'currentColor' : 'none'} />
          </button>
        );
      })}
    </div>
  );
}
