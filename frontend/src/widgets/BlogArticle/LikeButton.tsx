'use client';

import { Heart } from 'lucide-react';
import { useState } from 'react';

import { likePost } from '@/entities/post';
import { cn } from '@/shared/lib/cn';

import styles from './BlogArticle.module.scss';

interface Props {
  slug: string;
  initial: number;
}

export function LikeButton({ slug, initial }: Props) {
  const [count, setCount] = useState(initial);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    if (liked || busy) return;
    setBusy(true);
    try {
      const res = await likePost(slug);
      setCount(res.likes_count);
      setLiked(true);
    } catch {
      /* noop */
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(styles.like, liked && styles.likeActive)}
      disabled={liked || busy}
      aria-label="Like"
    >
      <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
      <span>{count}</span>
    </button>
  );
}
