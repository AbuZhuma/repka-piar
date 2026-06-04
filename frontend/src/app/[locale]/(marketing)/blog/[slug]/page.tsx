import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getPostBySlug, type PostFull } from '@/entities/post';
import { SITE, absoluteUrl, buildAlternates } from '@/shared/config/site';
import { ApiError } from '@/shared/lib/api';
import { assetUrl } from '@/shared/lib/format';
import {
  generateBlogPostingSchema,
  generateBreadcrumbSchema,
  jsonLdScript,
} from '@/shared/lib/seo';
import { BlogArticle } from '@/widgets/BlogArticle';

export const revalidate = 3600;

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  let post: PostFull;
  try {
    post = await getPostBySlug(slug, locale);
  } catch {
    return {
      title: 'Статья не найдена',
      robots: { index: false, follow: true },
    };
  }
  const ogImage =
    assetUrl(post.seo.og_image ?? post.cover_url ?? undefined) ??
    post.seo.og_image ??
    post.cover_url ??
    SITE.ogImage;
  const absoluteOgImage = ogImage.startsWith('http') ? ogImage : absoluteUrl(ogImage);
  const title = post.seo.title ?? post.title;
  const description = post.seo.description ?? post.excerpt ?? undefined;

  return {
    title: { absolute: `${title} — ${SITE.name}` },
    description,
    alternates: buildAlternates(locale, `/blog/${slug}`),
    keywords: post.tags?.length ? post.tags : undefined,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${SITE.url}/${locale}/blog/${post.slug}`,
      siteName: SITE.name,
      images: [
        { url: absoluteOgImage, width: 1200, height: 630, alt: title },
      ],
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.published_at ?? undefined,
      authors: post.author ? [post.author.name] : undefined,
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [absoluteOgImage],
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const tCrumbs = await getTranslations('breadcrumbs');

  let post: PostFull;
  try {
    post = await getPostBySlug(slug, locale);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const cover =
    assetUrl(post.cover_url ?? undefined) ?? post.cover_url ?? null;

  const articleSchema = generateBlogPostingSchema({
    title: post.title,
    description: post.excerpt ?? post.seo.description ?? undefined,
    slug: post.slug,
    cover_url: cover,
    author: post.author ? { name: post.author.name } : null,
    published_at: post.published_at ?? null,
    updated_at: post.published_at ?? null,
    tags: post.tags,
    locale,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { label: tCrumbs('home'), url: `/${locale}` },
    { label: tCrumbs('blog') ?? 'Блог', url: `/${locale}/blog` },
    ...(post.category
      ? [
          {
            label: post.category.name,
            url: `/${locale}/blog?category=${encodeURIComponent(post.category.slug)}`,
          },
        ]
      : []),
    { label: post.title },
  ]);

  return (
    <>
      <BlogArticle post={post} baseUrl={SITE.url} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbSchema) }}
      />
    </>
  );
}
