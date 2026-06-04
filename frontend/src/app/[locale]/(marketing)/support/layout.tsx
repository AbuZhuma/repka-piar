import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { SITE, buildAlternates } from '@/shared/config/site';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = 'Центр поддержки и FAQ — Repka';
  const description =
    'Ответы на самые частые вопросы об использовании Repka: поиск репетитора, регистрация, ' +
    'оплата уроков, безопасность данных, споры и жалобы. Контакты поддержки и форма обратной связи.';
  return {
    title: { absolute: title },
    description,
    alternates: buildAlternates(locale, '/support'),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE.url}/${locale}/support`,
    },
    twitter: { title, description },
  };
}

export default function SupportLayout({ children }: { children: ReactNode }) {
  return children;
}
