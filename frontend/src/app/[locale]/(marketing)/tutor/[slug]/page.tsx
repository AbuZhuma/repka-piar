import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { getSimilarTutors, getTutorBySlug } from '@/entities/tutor';
import { ApiError } from '@/shared/lib/api';
import { Container } from '@/shared/ui/Container';
import { Breadcrumbs } from '@/widgets/Breadcrumbs';
import { SimilarTutors } from '@/widgets/SimilarTutors';
import { TutorAbout } from '@/widgets/TutorAbout';
import { MobileContactBar, TutorContactsCard } from '@/widgets/TutorContactsCard';
import { TutorPrices } from '@/widgets/TutorPrices';
import { TutorProfileHeader } from '@/widgets/TutorProfileHeader';
import { TutorTabs } from '@/widgets/TutorTabs';
import { TutorVideo } from '@/widgets/TutorVideo';

import styles from './page.module.scss';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const tutor = await getTutorBySlug(slug);
    const subject = tutor.subjects[0]?.name_ru?.toLowerCase() ?? 'предмет';
    const desc = tutor.short_bio ?? tutor.bio?.slice(0, 160) ?? '';
    return {
      title: `${tutor.name} ${tutor.surname} — репетитор ${subject}`,
      description: desc,
      openGraph: tutor.photo_url
        ? { images: [{ url: tutor.photo_url }] }
        : undefined,
    };
  } catch {
    return { title: 'Профиль репетитора' };
  }
}

export default async function TutorPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const tCrumbs = await getTranslations('breadcrumbs');

  let tutor;
  try {
    tutor = await getTutorBySlug(slug);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  let similar = [] as Awaited<ReturnType<typeof getSimilarTutors>>;
  try {
    similar = await getSimilarTutors(slug, 6);
  } catch (e) {
    console.error('similar tutors fetch failed', e);
  }

  const primarySubject = tutor.subjects[0];
  const fullName = `${tutor.name} ${tutor.surname}`.trim();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: fullName,
    jobTitle: primarySubject ? `Репетитор ${primarySubject.name_ru.toLowerCase()}` : 'Репетитор',
    image: tutor.photo_url ?? undefined,
    address: tutor.city
      ? { '@type': 'PostalAddress', addressLocality: tutor.city.name_ru }
      : undefined,
    aggregateRating:
      typeof tutor.rating === 'number' && tutor.reviews_count > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: tutor.rating.toFixed(1),
            reviewCount: tutor.reviews_count,
          }
        : undefined,
  };

  return (
    <Container>
      <Breadcrumbs
        items={[
          { label: tCrumbs('home'), href: '/' },
          { label: tCrumbs('catalog'), href: '/catalog' },
          ...(primarySubject
            ? [{ label: primarySubject.name_ru, href: `/catalog/${primarySubject.slug}` }]
            : []),
          { label: fullName },
        ]}
      />

      <div className={styles.layout}>
        <main className={styles.main}>
          <TutorProfileHeader tutor={tutor} />
          <TutorTabs hasVideo={Boolean(tutor.video_url)} />
          <TutorAbout tutor={tutor} />
          <TutorPrices tutor={tutor} />
          {tutor.video_url && <TutorVideo url={tutor.video_url} />}
        </main>

        <aside className={styles.sidebar}>
          <TutorContactsCard tutor={tutor} />
        </aside>
      </div>

      <SimilarTutors tutors={similar} />
      <MobileContactBar tutor={tutor} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </Container>
  );
}
