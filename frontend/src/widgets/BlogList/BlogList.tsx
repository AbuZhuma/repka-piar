import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/routing';
import type { PostCategory, PostListItem } from '@/entities/post';
import { PostCard } from '@/entities/post';
import { Container } from '@/shared/ui/Container';
import { cn } from '@/shared/lib/cn';

import styles from './BlogList.module.scss';

interface BlogListProps {
  posts: PostListItem[];
  featured: PostListItem | null;
  categories: PostCategory[];
  pagination: { page: number; total_pages: number; total: number };
  activeCategory?: string;
  query?: string;
}

export function BlogList({
  posts,
  featured,
  categories,
  pagination,
  activeCategory,
  query,
}: BlogListProps) {
  const t = useTranslations('blog');

  return (
    <section className={styles.section}>
      <Container>
        <header className={styles.header}>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.subtitle}>{t('subtitle')}</p>

          <form className={styles.searchForm} action="/blog" method="GET" role="search">
            <Search size={20} className={styles.searchIcon} aria-hidden />
            <input
              type="search"
              name="q"
              defaultValue={query ?? ''}
              placeholder={t('search_placeholder')}
              className={styles.searchInput}
              aria-label={t('search_placeholder')}
            />
            <button type="submit" className={styles.searchSubmit}>
              {t('search_submit')}
            </button>
          </form>
        </header>

        <nav className={styles.tabs} aria-label={t('categories_label')}>
          <Link
            href={{ pathname: '/blog' }}
            className={cn(styles.tab, !activeCategory && !query && styles.active)}
          >
            {t('all')}
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={{ pathname: '/blog', query: { category: cat.slug } }}
              className={cn(styles.tab, activeCategory === cat.slug && styles.active)}
            >
              {cat.name}
            </Link>
          ))}
        </nav>

        {featured && !activeCategory && !query && (
          <div className={styles.featuredWrap}>
            <PostCard post={featured} variant="featured" />
          </div>
        )}

        {posts.length > 0 ? (
          <div className={styles.grid}>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : !featured ? (
          <div className={styles.empty}>
            <p>{t('empty')}</p>
          </div>
        ) : null}

        {pagination.total_pages > 1 && (
          <BlogPagination
            current={pagination.page}
            total={pagination.total_pages}
            category={activeCategory}
            query={query}
          />
        )}
      </Container>
    </section>
  );
}

function BlogPagination({
  current,
  total,
  category,
  query,
}: {
  current: number;
  total: number;
  category?: string;
  query?: string;
}) {
  const buildHref = (page: number) => {
    const q: Record<string, string> = {};
    if (category) q.category = category;
    if (query) q.q = query;
    if (page > 1) q.page = String(page);
    return { pathname: '/blog' as const, query: q };
  };

  const pages: number[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) pages.push(i);
  }

  return (
    <nav className={styles.pagination} aria-label="pagination">
      {pages.map((p, idx) => {
        const prev = pages[idx - 1];
        const showGap = prev !== undefined && p - prev > 1;
        return (
          <span key={p} className={styles.pageWrap}>
            {showGap && <span className={styles.gap}>…</span>}
            <Link
              href={buildHref(p)}
              className={cn(styles.page, p === current && styles.pageActive)}
            >
              {p}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
