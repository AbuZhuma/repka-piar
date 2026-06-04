'use client';

import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/shared/lib/cn';

import { useFavoritesStore, type FavoriteTutor } from '../model/store';

import styles from './FavoriteButton.module.scss';

interface Props {
  tutor: Omit<FavoriteTutor, 'added_at'>;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'pill';
  label?: { add: string; remove: string };
  onToggle?: (next: boolean) => void;
}

export function FavoriteButton({
  tutor,
  size = 'md',
  variant = 'icon',
  label,
  onToggle,
}: Props) {
  const items = useFavoritesStore((s) => s.items);
  const toggle = useFavoritesStore((s) => s.toggle);
  // Avoid SSR hydration mismatch — only read state after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const active = mounted && items.some((t) => t.id === tutor.id);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle({ ...tutor, added_at: Date.now() });
    onToggle?.(!active);
  };

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 22 : 18;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        styles.btn,
        styles[`size_${size}`],
        styles[`variant_${variant}`],
        active && styles.active,
      )}
      aria-pressed={active}
      aria-label={active ? label?.remove ?? 'Убрать из избранного' : label?.add ?? 'В избранное'}
      title={active ? label?.remove ?? 'Убрать из избранного' : label?.add ?? 'В избранное'}
    >
      <Heart size={iconSize} fill={active ? 'currentColor' : 'none'} />
      {variant === 'pill' && (
        <span>{active ? label?.remove ?? 'В избранном' : label?.add ?? 'В избранное'}</span>
      )}
    </button>
  );
}
