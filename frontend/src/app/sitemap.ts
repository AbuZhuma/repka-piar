import type { MetadataRoute } from 'next';

import { getTutorsList } from '@/entities/tutor';
import { SITE } from '@/shared/config/site';
import { getPosts } from '@/entities/post';

const LOCALES = SITE.locale.supported;

/** Pages that should never be indexed (auth flows, success states). */
const NO_INDEX_PAGES = new Set<string>([
  '/favorites',
  '/become-tutor/register',
  '/become-tutor/success',
]);

interface StaticPage {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
}

const STATIC_PAGES: StaticPage[] = [
  { path: '', changeFrequency: 'daily', priority: 1.0 },
  { path: '/catalog', changeFrequency: 'daily', priority: 0.95 },
  { path: '/blog', changeFrequency: 'daily', priority: 0.8 },
  { path: '/for-students', changeFrequency: 'weekly', priority: 0.85 },
  { path: '/for-tutors', changeFrequency: 'weekly', priority: 0.85 },
  { path: '/support', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/contacts', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/become-tutor', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/legal/tutor-offer', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/legal/privacy', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/legal/cookies', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/legal/rules', changeFrequency: 'yearly', priority: 0.2 },
];

function buildAlternates(path: string) {
  const alternates: Record<string, string> = {};
  for (const loc of LOCALES) {
    alternates[SITE.locale.hreflang[loc] ?? loc] = `${SITE.url}/${loc}${path}`;
  }
  alternates['x-default'] = `${SITE.url}/${SITE.locale.default}${path}`;
  return alternates;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const urls: MetadataRoute.Sitemap = [];

  for (const page of STATIC_PAGES) {
    for (const locale of LOCALES) {
      urls.push({
        url: `${SITE.url}/${locale}${page.path}`,
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: { languages: buildAlternates(page.path) },
      });
    }
  }

  // Dynamic: tutor profiles
  try {
    const tutors = await getTutorsList({ limit: 1000, sort: 'new' });
    for (const tutor of tutors.data) {
      const path = `/tutor/${tutor.slug}`;
      if (NO_INDEX_PAGES.has(path)) continue;
      for (const locale of LOCALES) {
        urls.push({
          url: `${SITE.url}/${locale}${path}`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.9,
          alternates: { languages: buildAlternates(path) },
        });
      }
    }
  } catch (e) {
    console.error('sitemap: failed to fetch tutors', e);
  }

  // Dynamic: blog posts
  try {
    const posts = await getPosts({ limit: 200, locale: SITE.locale.default });
    for (const post of posts.data) {
      const path = `/blog/${post.slug}`;
      for (const locale of LOCALES) {
        urls.push({
          url: `${SITE.url}/${locale}${path}`,
          lastModified: post.published_at ? new Date(post.published_at) : now,
          changeFrequency: 'monthly',
          priority: 0.7,
          alternates: { languages: buildAlternates(path) },
        });
      }
    }
  } catch (e) {
    console.error('sitemap: failed to fetch posts', e);
  }

  return urls;
}
