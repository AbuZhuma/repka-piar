import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';

import type { PostFull } from '@/entities/post';
import { PostCard } from '@/entities/post';
import { BlockRenderer } from '@/features/blog-renderer';
import { Link } from '@/i18n/routing';
import { cn } from '@/shared/lib/cn';
import { Container } from '@/shared/ui/Container';
import { assetUrl } from '@/shared/lib/format';
import { Breadcrumbs } from '@/widgets/Breadcrumbs';

import { LikeButton } from './LikeButton';
import { ShareButtons } from './ShareButtons';
import { TableOfContents } from './TableOfContents';

import styles from './BlogArticle.module.scss';

interface BlogArticleProps {
  post: PostFull;
  baseUrl: string;
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

export function BlogArticle({ post, baseUrl }: BlogArticleProps) {
  const t = useTranslations('blog');
  const locale = useLocale();
  const url = `${baseUrl}/${locale}/blog/${post.slug}`;
  const cover = assetUrl(post.cover_url ?? undefined) ?? post.cover_url ?? null;
  const authorAvatar =
    assetUrl(post.author?.avatar_url ?? undefined) ?? post.author?.avatar_url ?? null;
  const headingsCount = post.content.filter((b) => b.type === 'heading').length;
  const hasToc = headingsCount >= 3;

  return (
    <article className={styles.article}>
      <Container>
        <div className={cn(styles.shell, hasToc && styles.shellWithToc)}>
          <div className={styles.main}>
            <header className={styles.header}>
              <Breadcrumbs
                items={[
                  { label: t('breadcrumb_home'), href: '/' },
                  { label: t('breadcrumb_blog'), href: '/blog' },
                  ...(post.category
                    ? [{ label: post.category.name, href: `/blog?category=${post.category.slug}` }]
                    : []),
                  { label: post.title },
                ]}
              />

              {post.category && (
                <Link
                  href={`/blog?category=${post.category.slug}`}
                  className={styles.category}
                >
                  {post.category.name}
                </Link>
              )}

              <h1 className={styles.title}>{post.title}</h1>
              {post.excerpt && <p className={styles.lede}>{post.excerpt}</p>}

              {post.is_translation_missing && (
                <p className={styles.translationNotice}>{t('translation_missing')}</p>
              )}

              <div className={styles.meta}>
                {post.author && (
                  <div className={styles.author}>
                    {authorAvatar && (
                      <Image
                        src={authorAvatar}
                        alt=""
                        width={40}
                        height={40}
                        className={styles.authorAvatar}
                        unoptimized
                      />
                    )}
                    <div>
                      <p className={styles.authorName}>{post.author.name}</p>
                      {post.author.role && <p className={styles.authorRole}>{post.author.role}</p>}
                    </div>
                  </div>
                )}
                <span className={styles.metaSep}>·</span>
                <span>{formatDate(post.published_at, locale)}</span>
                {post.reading_time && (
                  <>
                    <span className={styles.metaSep}>·</span>
                    <span>{t('reading_time', { count: post.reading_time })}</span>
                  </>
                )}
              </div>

              <ShareButtons url={url} title={post.title} />
            </header>

            {cover && (
              <div className={styles.cover}>
                <Image
                  src={cover}
                  alt={post.title}
                  width={1280}
                  height={720}
                  className={styles.coverImg}
                  priority
                  unoptimized
                />
              </div>
            )}

            <div className={styles.content}>
              <BlockRenderer blocks={post.content} />
            </div>

            <footer className={styles.footer}>
              {post.tags.length > 0 && (
                <div className={styles.tags}>
                  {post.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <div className={styles.actions}>
                <LikeButton slug={post.slug} initial={0} />
                <ShareButtons url={url} title={post.title} />
              </div>
              {post.author?.bio && (
                <div className={styles.aboutAuthor}>
                  {authorAvatar && (
                    <Image
                      src={authorAvatar}
                      alt=""
                      width={64}
                      height={64}
                      className={styles.authorAvatarLg}
                      unoptimized
                    />
                  )}
                  <div>
                    <p className={styles.aboutAuthorName}>{post.author.name}</p>
                    <p className={styles.aboutAuthorBio}>{post.author.bio}</p>
                  </div>
                </div>
              )}
            </footer>
          </div>

          {hasToc && (
            <aside className={styles.tocAside}>
              <TableOfContents content={post.content} />
            </aside>
          )}
        </div>
      </Container>

      {post.related.length > 0 && (
        <section className={styles.relatedSection}>
          <Container>
            <h2 className={styles.relatedTitle}>{t('related_title')}</h2>
            <div className={styles.relatedGrid}>
              {post.related.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </article>
  );
}
