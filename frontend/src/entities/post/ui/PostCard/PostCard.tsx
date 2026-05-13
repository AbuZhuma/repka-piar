import Image from 'next/image';
import { useLocale } from 'next-intl';

import { Link } from '@/i18n/routing';
import { assetUrl } from '@/shared/lib/format';

import type { PostListItem } from '../../model/types';

import styles from './PostCard.module.scss';

interface PostCardProps {
  post: PostListItem;
  variant?: 'default' | 'featured';
}

const localeMap = { ru: 'ru-RU', kg: 'ky-KG', en: 'en-US' } as const;

function formatDate(date: string | undefined | null, locale: string) {
  if (!date) return '';
  const lang = localeMap[locale as keyof typeof localeMap] ?? 'ru-RU';
  try {
    return new Date(date).toLocaleDateString(lang, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function gradientFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  const hue = Math.abs(hash) % 360;
  return `linear-gradient(135deg, hsl(${hue}, 70%, 60%), hsl(${(hue + 60) % 360}, 70%, 50%))`;
}

export function PostCard({ post, variant = 'default' }: PostCardProps) {
  const locale = useLocale();
  const cover = assetUrl(post.cover_url ?? undefined) ?? post.cover_url ?? null;
  const fallbackBg = gradientFor(post.slug);
  const fallbackInitial = (post.category?.name?.[0] ?? post.title[0] ?? '').toUpperCase();

  if (variant === 'featured') {
    return (
      <Link href={`/blog/${post.slug}`} className={styles.featured}>
        <div className={styles.featuredImage}>
          {cover ? (
            <Image
              src={cover}
              alt={post.title}
              fill
              sizes="(max-width: 900px) 100vw, 50vw"
              className={styles.featuredImg}
              unoptimized
            />
          ) : (
            <div className={styles.coverFallback} style={{ background: fallbackBg }} aria-hidden>
              <span>{fallbackInitial}</span>
            </div>
          )}
        </div>
        <div className={styles.featuredBody}>
          {post.category && <span className={styles.category}>{post.category.name}</span>}
          <h2 className={styles.featuredTitle}>{post.title}</h2>
          {post.excerpt && <p className={styles.excerpt}>{post.excerpt}</p>}
          <div className={styles.meta}>
            {post.author && (
              <>
                {post.author.avatar_url && (
                  <Image
                    src={assetUrl(post.author.avatar_url) ?? post.author.avatar_url}
                    alt=""
                    width={28}
                    height={28}
                    className={styles.avatar}
                    unoptimized
                  />
                )}
                <span>{post.author.name}</span>
                <span aria-hidden>·</span>
              </>
            )}
            <span>{formatDate(post.published_at, locale)}</span>
            {post.reading_time && (
              <>
                <span aria-hidden>·</span>
                <span>{post.reading_time} мин</span>
              </>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <article className={styles.card}>
      <Link href={`/blog/${post.slug}`} className={styles.link}>
        <div className={styles.cover}>
          {cover ? (
            <Image
              src={cover}
              alt={post.title}
              fill
              sizes="(max-width: 700px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={styles.coverImg}
              unoptimized
            />
          ) : (
            <div className={styles.coverFallback} style={{ background: fallbackBg }} aria-hidden>
              <span>{fallbackInitial}</span>
            </div>
          )}
        </div>
        <div className={styles.body}>
          {post.category && <span className={styles.category}>{post.category.name}</span>}
          <h3 className={styles.title}>{post.title}</h3>
          {post.excerpt && <p className={styles.excerpt}>{post.excerpt}</p>}
          <div className={styles.meta}>
            {post.author && <span>{post.author.name}</span>}
            {post.author && <span aria-hidden>·</span>}
            <span>{formatDate(post.published_at, locale)}</span>
            {post.reading_time && (
              <>
                <span aria-hidden>·</span>
                <span>{post.reading_time} мин</span>
              </>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
