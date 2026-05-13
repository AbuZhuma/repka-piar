import type { TutorPublic } from '@/shared/types';

export function generatePersonSchema(tutor: TutorPublic, baseUrl: string) {
  const fullName = `${tutor.name} ${tutor.surname}`.trim();
  const photo = tutor.photo_url
    ? tutor.photo_url.startsWith('http')
      ? tutor.photo_url
      : `${baseUrl}${tutor.photo_url}`
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: fullName,
    url: `${baseUrl}/tutor/${tutor.slug}`,
    jobTitle: 'Репетитор',
    ...(photo ? { image: photo } : {}),
    ...(tutor.city
      ? {
          address: {
            '@type': 'PostalAddress',
            addressLocality: tutor.city.name_ru,
            addressCountry: 'KG',
          },
        }
      : {}),
    ...(tutor.rating && tutor.reviews_count
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: tutor.rating,
            reviewCount: tutor.reviews_count,
          },
        }
      : {}),
  };
}

export function generateItemListSchema(tutors: TutorPublic[], baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: tutors.map((tutor, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: generatePersonSchema(tutor, baseUrl),
    })),
  };
}

export function generateBreadcrumbSchema(
  items: Array<{ label: string; url?: string }>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}

export function generateFAQSchema(faq: Array<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  };
}

export function generateOrganizationSchema(baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Repka',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    sameAs: ['https://t.me/repka_kg'],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@repka.kg',
      contactType: 'customer support',
      areaServed: 'KG',
      availableLanguage: ['ru', 'kg', 'en'],
    },
  };
}

export function jsonLdScript(schema: object): string {
  return JSON.stringify(schema);
}
