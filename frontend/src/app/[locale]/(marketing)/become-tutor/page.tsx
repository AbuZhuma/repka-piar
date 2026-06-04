import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { SITE, buildAlternates } from '@/shared/config/site';
import { BecomeTutorLanding } from '@/widgets/BecomeTutorLanding';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = `Стать репетитором на ${SITE.name} — размещение профиля бесплатно`;
  const description =
    'Разместите анкету репетитора на Repka бесплатно. Без комиссий с уроков, без подписок. ' +
    'Ученики приходят к вам напрямую — мы проверяем профиль и помогаем правильно его собрать.';
  return {
    title: { absolute: title },
    description,
    alternates: buildAlternates(locale, '/become-tutor'),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE.url}/${locale}/become-tutor`,
    },
    twitter: { title, description },
  };
}

export default async function BecomeTutorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <BecomeTutorLanding />;
}
