import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://repka.kg';
const LOCALES = ['ru', 'kg', 'en'] as const;

const STATIC_PAGES: string[] = [
  '',
  '/catalog',
  '/blog',
  '/for-students',
  '/for-tutors',
  '/support',
  '/about',
  '/contacts',
  '/become-tutor',
  '/legal/tutor-offer',
  '/legal/privacy',
  '/legal/cookies',
  '/legal/rules',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const urls: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    for (const page of STATIC_PAGES) {
      urls.push({
        url: `${BASE_URL}/${locale}${page}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: page === '' ? 1.0 : 0.7,
      });
    }
  }

  return urls;
}
