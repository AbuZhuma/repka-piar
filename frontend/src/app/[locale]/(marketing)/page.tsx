import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getTutorsList } from '@/entities/tutor';
import { getDictionaries } from '@/shared/api/dictionaries';
import { getPlatformStats, type PlatformStats } from '@/shared/api/stats';
import { SITE, buildAlternates } from '@/shared/config/site';
import { generateItemListSchema, jsonLdScript } from '@/shared/lib/seo';
import { ExamTiles } from '@/widgets/ExamTiles';
import { Hero } from '@/widgets/Hero';
import { HowItWorksStrip } from '@/widgets/HowItWorksStrip';
import { SubjectsLane } from '@/widgets/SubjectsLane';
import { TutorsGrid } from '@/widgets/TutorsGrid';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = `${SITE.name} — репетиторы в Бишкеке и онлайн по всему Кыргызстану`;
  const description =
    'Подберите репетитора по 20+ предметам: ОРТ, ЕГЭ, IELTS, TOEFL, школьная программа, ' +
    'кыргызский и английский языки. 500+ проверенных педагогов. Прямые контакты, прозрачные ' +
    'цены, без комиссий с уроков и без посредников.';
  return {
    title: { absolute: title },
    description,
    alternates: buildAlternates(locale, '/'),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE.url}/${locale}`,
    },
    twitter: { title, description },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('homepage');

  let tutors: Awaited<ReturnType<typeof getTutorsList>> = {
    data: [],
    pagination: { page: 1, limit: 16, total: 0, total_pages: 0 },
  };
  let dictionaries: Awaited<ReturnType<typeof getDictionaries>> = { cities: [], subjects: [] };
  let stats: PlatformStats | null = null;
  try {
    [tutors, dictionaries, stats] = await Promise.all([
      getTutorsList({ limit: 16, sort: 'relevance' }),
      getDictionaries(),
      getPlatformStats().catch(() => null),
    ]);
  } catch (e) {
    console.error('homepage data fetch failed', e);
  }

  const totalTutors = stats?.tutors_total ?? tutors.pagination.total;

  return (
    <>
      <Hero
        subjects={dictionaries.subjects}
        totalTutors={totalTutors}
        citiesCount={stats?.cities_total ?? dictionaries.cities.length}
      />
      <SubjectsLane subjects={dictionaries.subjects} />
      <TutorsGrid tutors={tutors.data} title={t('tutors_title')} showAllLink />
      <ExamTiles />
      <HowItWorksStrip />
      {tutors.data.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdScript(generateItemListSchema(tutors.data)),
          }}
        />
      )}
    </>
  );
}
