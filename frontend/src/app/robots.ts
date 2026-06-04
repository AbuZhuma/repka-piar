import type { MetadataRoute } from 'next';

import { SITE } from '@/shared/config/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/*/cabinet/',
          '/*/admin/',
          '/*/login',
          '/*/register',
          '/*/forgot-password',
          '/*/reset-password',
          '/*/become-tutor/register',
          '/*/become-tutor/success',
          '/*/favorites',
          '/*/search',
          '/api/',
          '/uploads/',
          '/*?utm_*',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
