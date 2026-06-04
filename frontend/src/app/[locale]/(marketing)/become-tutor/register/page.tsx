import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { SITE, buildAlternates } from '@/shared/config/site';
import { TutorRegistrationFlow } from '@/widgets/TutorRegistrationFlow';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Регистрация репетитора — анкета и документы',
    description:
      'Заполните анкету репетитора на Repka: данные, опыт, образование, цены и контакты. ' +
      '10 шагов, можно сохранить черновик и вернуться позже.',
    alternates: buildAlternates(locale, '/become-tutor/register'),
    robots: { index: false, follow: true },
    openGraph: {
      title: `Регистрация репетитора — ${SITE.name}`,
      type: 'website',
      url: `${SITE.url}/${locale}/become-tutor/register`,
    },
  };
}

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TutorRegistrationFlow />;
}
