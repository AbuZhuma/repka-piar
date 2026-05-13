import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { getPostBySlug, type PostFull } from '@/entities/post';
import { ApiError } from '@/shared/lib/api';
import { assetUrl } from '@/shared/lib/format';
import { BlogArticle } from '@/widgets/BlogArticle';

export const revalidate = 3600;

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://repka.kg';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  let post: PostFull;
  try {
    post = await getPostBySlug(slug, locale);
  } catch {
    return { title: 'Repka' };
  }
  const ogImage =
    assetUrl(post.seo.og_image ?? post.cover_url ?? undefined) ??
    post.seo.og_image ??
    post.cover_url ??
    null;
  const title = post.seo.title ?? post.title;
  const description = post.seo.description ?? post.excerpt ?? undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${SITE_URL}/${locale}/blog/${post.slug}`,
      images: ogImage ? [ogImage] : undefined,
      publishedTime: post.published_at ?? undefined,
      authors: post.author ? [post.author.name] : undefined,
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug, locale } = await params;
  setRequestLocale(locale);

  let post: PostFull;
  try {
    post = await getPostBySlug(slug, locale);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const ogImage =
    assetUrl(post.seo.og_image ?? post.cover_url ?? undefined) ??
    post.seo.og_image ??
    post.cover_url ??
    null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: ogImage ?? undefined,
    datePublished: post.published_at ?? undefined,
    dateModified: post.published_at ?? undefined,
    author: post.author
      ? {
          '@type': 'Person',
          name: post.author.name,
          ...(post.author.bio ? { description: post.author.bio } : {}),
        }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Repka',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
  };

  return (
    <>
      <BlogArticle post={post} baseUrl={SITE_URL} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </>
  );
}
