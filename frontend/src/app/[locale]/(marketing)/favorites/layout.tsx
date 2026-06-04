import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { SITE, buildAlternates } from '@/shared/config/site';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Избранные репетиторы — сохранено в браузере',
    description:
      'Список репетиторов, которых вы добавили в избранное. Хранится локально у вас в браузере, регистрация не нужна.',
    alternates: buildAlternates(locale, '/favorites'),
    robots: { index: false, follow: true },
    openGraph: {
      title: `Избранные репетиторы — ${SITE.name}`,
      type: 'website',
      url: `${SITE.url}/${locale}/favorites`,
    },
  };
}

export default function FavoritesLayout({ children }: { children: ReactNode }) {
  return children;
}
