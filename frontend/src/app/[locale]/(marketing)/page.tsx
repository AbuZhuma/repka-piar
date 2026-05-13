import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getTutorsList } from '@/entities/tutor';
import { getDictionaries } from '@/shared/api/dictionaries';
import { ExamTiles } from '@/widgets/ExamTiles';
import { Hero } from '@/widgets/Hero';
import { HowItWorksStrip } from '@/widgets/HowItWorksStrip';
import { SubjectsLane } from '@/widgets/SubjectsLane';
import { TutorsGrid } from '@/widgets/TutorsGrid';

export const dynamic = 'force-dynamic';

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
  try {
    [tutors, dictionaries] = await Promise.all([
      getTutorsList({ limit: 16, sort: 'relevance' }),
      getDictionaries(),
    ]);
  } catch (e) {
    console.error('homepage data fetch failed', e);
  }

  return (
    <>
      <Hero subjects={dictionaries.subjects} totalTutors={tutors.pagination.total} />
      <SubjectsLane subjects={dictionaries.subjects} />
      <TutorsGrid tutors={tutors.data} title={t('tutors_title')} showAllLink />
      <ExamTiles />
      <HowItWorksStrip />
    </>
  );
}
