import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Excludes:
  //   /api/*               — API routes
  //   /_next/*, /_vercel/* — internals
  //   any path with a dot  — static files like /icon.svg, /sitemap.xml, /robots.txt
  //   /apple-icon          — dynamic icon (no extension)
  //   /opengraph-image     — dynamic OG image (no extension)
  //   /twitter-image       — dynamic Twitter image (no extension)
  //   /icon                — dynamic favicon
  //   /manifest            — webmanifest
  matcher: [
    '/((?!api|_next|_vercel|apple-icon|opengraph-image|twitter-image|icon|manifest|.*\\..*).*)',
  ],
};
