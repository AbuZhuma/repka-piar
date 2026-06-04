import { SITE, absoluteUrl } from '@/shared/config/site';
import type { TutorPublic } from '@/shared/types';

function ensureAbsolute(maybeUrl: string | null | undefined): string | undefined {
  if (!maybeUrl) return undefined;
  if (maybeUrl.startsWith('http://') || maybeUrl.startsWith('https://')) return maybeUrl;
  return absoluteUrl(maybeUrl);
}

/* ------------------------------------------------------------- Person  */

export function generatePersonSchema(tutor: TutorPublic) {
  const fullName = `${tutor.name} ${tutor.surname}`.trim();
  const photo = ensureAbsolute(tutor.photo_url);
  const tutorUrl = absoluteUrl(`/tutor/${tutor.slug}`);

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: fullName,
    url: tutorUrl,
    jobTitle: 'Репетитор',
    knowsAbout: tutor.specializations ?? [],
    ...(photo ? { image: photo } : {}),
    ...(tutor.bio || tutor.short_bio ? { description: tutor.bio ?? tutor.short_bio } : {}),
    ...(tutor.city
      ? {
          address: {
            '@type': 'PostalAddress',
            addressLocality: tutor.city.name_ru,
            addressCountry: SITE.country,
          },
        }
      : {}),
    ...(tutor.rating && tutor.reviews_count
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: tutor.rating,
            reviewCount: tutor.reviews_count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    ...(tutor.price?.per_60
      ? {
          makesOffer: {
            '@type': 'Offer',
            priceCurrency: tutor.price.currency || 'KGS',
            price: tutor.price.per_60,
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: tutor.price.per_60,
              priceCurrency: tutor.price.currency || 'KGS',
              unitText: 'HUR',
            },
          },
        }
      : {}),
  };
}

/* ------------------------------------------------------------- ItemList */

export function generateItemListSchema(tutors: TutorPublic[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: tutors.length,
    itemListElement: tutors.map((tutor, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: generatePersonSchema(tutor),
    })),
  };
}

/* --------------------------------------------------------- Breadcrumbs  */

export function generateBreadcrumbSchema(
  items: Array<{ label: string; url?: string | null }>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.url ? { item: ensureAbsolute(item.url) } : {}),
    })),
  };
}

/* ------------------------------------------------------------------- FAQ */

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

/* --------------------------------------------------------- Organization */

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE.url}/#organization`,
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE.url,
    logo: absoluteUrl('/icon.svg'),
    image: absoluteUrl(SITE.ogImage),
    description: SITE.shortDescription,
    sameAs: [SITE.telegram],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        email: SITE.email,
        telephone: SITE.phone,
        contactType: 'customer support',
        areaServed: SITE.country,
        availableLanguage: SITE.locale.supported as unknown as string[],
      },
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: SITE.city,
      addressCountry: SITE.country,
    },
  };
}

/* -------------------------------------------------------------- WebSite */

export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE.url}/#website`,
    name: SITE.name,
    url: SITE.url,
    description: SITE.shortDescription,
    inLanguage: SITE.locale.supported as unknown as string[],
    publisher: { '@id': `${SITE.url}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE.url}/ru/catalog?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/* ---------------------------------------------------------- BlogPosting */

export interface PostSchemaInput {
  title: string;
  description?: string | null;
  slug: string;
  cover_url?: string | null;
  author?: { name: string } | null;
  published_at?: string | null;
  updated_at?: string | null;
  tags?: string[];
  locale: string;
}

export function generateBlogPostingSchema(post: PostSchemaInput) {
  const url = absoluteUrl(`/${post.locale}/blog/${post.slug}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description ?? undefined,
    image: post.cover_url ? ensureAbsolute(post.cover_url) : absoluteUrl(SITE.ogImage),
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    datePublished: post.published_at ?? undefined,
    dateModified: post.updated_at ?? post.published_at ?? undefined,
    inLanguage: post.locale,
    author: {
      '@type': 'Person',
      name: post.author?.name ?? SITE.name,
    },
    publisher: { '@id': `${SITE.url}/#organization` },
    keywords: post.tags?.join(', '),
  };
}

/* ----------------------------------------------------------- Serialize  */

export function jsonLdScript(schema: object | object[]): string {
  // Strip undefined to keep JSON minimal — schema.org tolerates missing fields.
  return JSON.stringify(schema, (_k, v) => (v === undefined ? undefined : v));
}
