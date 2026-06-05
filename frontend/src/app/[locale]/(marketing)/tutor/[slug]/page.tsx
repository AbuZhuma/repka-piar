import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { getSimilarTutors, getTutorBySlug } from '@/entities/tutor';
import { ROUTES } from '@/shared/config/routes';
import { SITE, absoluteUrl, buildAlternates } from '@/shared/config/site';
import { ApiError } from '@/shared/lib/api';
import {
  generateBreadcrumbSchema,
  generatePersonSchema,
  jsonLdScript,
} from '@/shared/lib/seo';
import { Container } from '@/shared/ui/Container';
import { Breadcrumbs } from '@/widgets/Breadcrumbs';
import { ReviewsBlock } from '@/features/tutor-reviews';
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
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  try {
    const tutor = await getTutorBySlug(slug);
    const fullName = `${tutor.name} ${tutor.surname}`.trim();
    const subject = tutor.subjects[0]?.name_ru ?? 'предмет';
    const city = tutor.city?.name_ru;
    const formats = tutor.formats?.map((f) => f).join(', ');
    void formats;
    const price = tutor.price?.per_60
      ? ` от ${tutor.price.per_60} ${tutor.price.currency ?? 'KGS'}/час`
      : '';

    const title = `${fullName} — репетитор ${subject.toLowerCase()}${
      city ? ` в ${city}` : ''
    }${price ? ` ·${price}` : ''}`;

    const baseDesc =
      tutor.short_bio?.trim() ||
      tutor.bio?.slice(0, 200).trim() ||
      `Репетитор ${subject.toLowerCase()}${city ? ` из ${city}` : ''}. ${tutor.experience_years} лет опыта.`;
    const description = `${baseDesc}${price ? ` Стоимость${price}.` : ''} Свяжитесь напрямую через ${SITE.name}.`;

    const ogImage = tutor.photo_url ?? SITE.ogImage;

    return {
      title: { absolute: title },
      description,
      alternates: buildAlternates(locale, `/tutor/${slug}`),
      openGraph: {
        type: 'profile',
        title: fullName,
        description,
        url: `${SITE.url}/${locale}/tutor/${slug}`,
        firstName: tutor.name,
        lastName: tutor.surname,
        images: [
          {
            url: ogImage.startsWith('http') ? ogImage : absoluteUrl(ogImage),
            alt: fullName,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: fullName,
        description,
        images: [ogImage.startsWith('http') ? ogImage : absoluteUrl(ogImage)],
      },
    };
  } catch {
    return {
      title: 'Профиль репетитора',
      robots: { index: false, follow: true },
    };
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

  const personSchema = generatePersonSchema(tutor);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { label: tCrumbs('home'), url: `/${locale}` },
    { label: tCrumbs('catalog'), url: `/${locale}/catalog` },
    ...(primarySubject
      ? [
          {
            label: primarySubject.name_ru,
            url: `/${locale}/catalog?subject=${primarySubject.slug}`,
          },
        ]
      : []),
    { label: fullName },
  ]);

  return (
    <Container>
      <Breadcrumbs
        items={[
          { label: tCrumbs('home'), href: ROUTES.home },
          { label: tCrumbs('catalog'), href: ROUTES.catalog },
          ...(primarySubject
            ? [
                {
                  label: primarySubject.name_ru,
                  href: ROUTES.catalogBy({ subject: primarySubject.slug }),
                },
              ]
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
          <ReviewsBlock slug={slug} fullName={fullName} />
        </main>

        <aside className={styles.sidebar}>
          <TutorContactsCard tutor={tutor} />
        </aside>
      </div>

      <SimilarTutors tutors={similar} />
      <MobileContactBar tutor={tutor} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(personSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbSchema) }}
      />
    </Container>
  );
}
