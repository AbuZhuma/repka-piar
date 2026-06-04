'use client';

import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Link } from '@/i18n/routing';
import { ROUTES } from '@/shared/config/routes';

import { useFavoritesStore } from '../model/store';

import styles from './FavoritesIndicator.module.scss';

interface Props {
  ariaLabel?: string;
}

export function FavoritesIndicator({ ariaLabel = 'Избранное' }: Props) {
  const count = useFavoritesStore((s) => s.items.length);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Link href={ROUTES.favorites} className={styles.link} aria-label={ariaLabel}>
      <Heart size={18} fill={mounted && count > 0 ? 'currentColor' : 'none'} />
      {mounted && count > 0 && <span className={styles.badge}>{count}</span>}
    </Link>
  );
}
