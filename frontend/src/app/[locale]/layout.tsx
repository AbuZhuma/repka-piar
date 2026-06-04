import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { routing } from '@/i18n/routing';
import { SITE, absoluteUrl, buildAlternates } from '@/shared/config/site';
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
  jsonLdScript,
} from '@/shared/lib/seo';
import '@/styles/index.scss';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    template: `%s — ${SITE.name}`,
    default: `${SITE.name} — маркетплейс репетиторов в Кыргызстане`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  generator: 'Next.js',
  keywords: [
    'репетитор',
    'репетиторы Бишкек',
    'репетиторы Кыргызстан',
    'подготовка к ОРТ',
    'IELTS Бишкек',
    'TOEFL подготовка',
    'английский язык',
    'математика репетитор',
    'онлайн занятия',
    'Repka',
  ],
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.name,
  formatDetection: { telephone: true, email: true, address: false },
  referrer: 'origin-when-cross-origin',
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    title: `${SITE.name} — маркетплейс репетиторов в Кыргызстане`,
    description: SITE.description,
    url: SITE.url,
    locale: 'ru_KG',
    alternateLocale: ['ky_KG', 'en_US'],
    images: [
      {
        url: absoluteUrl(SITE.ogImage),
        width: 1200,
        height: 630,
        alt: SITE.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} — репетиторы в Кыргызстане`,
    description: SITE.shortDescription,
    site: SITE.twitter,
    creator: SITE.twitter,
    images: [absoluteUrl(SITE.ogImage)],
  },
  alternates: buildAlternates('ru', '/'),
  category: 'education',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: SITE.themeColor },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },
  ],
  colorScheme: 'light',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} className={inter.variable}>
      <head>
        <link rel="preconnect" href={SITE.url} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(generateOrganizationSchema()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(generateWebSiteSchema()) }}
        />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
