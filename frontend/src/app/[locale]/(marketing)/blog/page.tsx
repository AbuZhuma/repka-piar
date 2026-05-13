import { setRequestLocale } from 'next-intl/server';

import {
  getFeaturedPost,
  getPostCategories,
  getPosts,
  type PostCategory,
  type PostListItem,
  type PostsListResponse,
} from '@/entities/post';
import { BlogList } from '@/widgets/BlogList';

export const revalidate = 3600;

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function pickString(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function pickNumber(v: string | string[] | undefined): number | undefined {
  const s = pickString(v);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export default async function BlogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const category = pickString(sp.category);
  const query = pickString(sp.q);
  const page = pickNumber(sp.page) ?? 1;

  let posts: PostsListResponse = {
    data: [],
    pagination: { page, limit: 12, total: 0, total_pages: 0 },
  };
  let categories: PostCategory[] = [];
  let featured: PostListItem | null = null;

  try {
    const showFeatured = !category && !query && page === 1;
    const [postsRes, catsRes, featuredRes] = await Promise.all([
      getPosts({ category, q: query, page, limit: 12, locale }),
      getPostCategories(locale),
      showFeatured ? getFeaturedPost(locale) : Promise.resolve(null),
    ]);
    posts = postsRes;
    categories = catsRes;
    featured = featuredRes;
  } catch (e) {
    console.error('blog list fetch failed', e);
  }

  const visiblePosts = featured
    ? posts.data.filter((p) => p.id !== featured.id)
    : posts.data;

  return (
    <BlogList
      posts={visiblePosts}
      featured={featured}
      categories={categories}
      pagination={posts.pagination}
      activeCategory={category}
      query={query}
    />
  );
}
