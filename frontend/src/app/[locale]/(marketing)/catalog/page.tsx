import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getTutorsList } from '@/entities/tutor';
import type { CatalogFilters } from '@/entities/tutor/model/types';
import { getDictionaries } from '@/shared/api/dictionaries';
import { CatalogLayout } from '@/widgets/CatalogLayout';

export const dynamic = 'force-dynamic';

const SORT_VALUES = ['relevance', 'price_asc', 'price_desc', 'experience', 'new'] as const;

function parseFilters(sp: Record<string, string | string[] | undefined>): CatalogFilters {
  const get = (key: string): string | undefined => {
    const v = sp[key];
    if (Array.isArray(v)) return v[0];
    return v;
  };
  const num = (key: string): number | undefined => {
    const v = get(key);
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const sort = get('sort');
  return {
    subject: get('subject'),
    goal: get('goal') as CatalogFilters['goal'],
    format: get('format') as CatalogFilters['format'],
    city: get('city'),
    age_group: get('age_group') as CatalogFilters['age_group'],
    language: get('language') as CatalogFilters['language'],
    is_native: get('is_native') === 'true' ? true : undefined,
    q: get('q'),
    price_min: num('price_min'),
    price_max: num('price_max'),
    experience_min: num('experience_min'),
    sort:
      sort && (SORT_VALUES as readonly string[]).includes(sort)
        ? (sort as CatalogFilters['sort'])
        : undefined,
    page: num('page') ?? 1,
    limit: 12,
  };
}

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations('catalog');

  const filters = parseFilters(sp);

  let data: Awaited<ReturnType<typeof getTutorsList>> = {
    data: [],
    pagination: { page: filters.page ?? 1, limit: filters.limit ?? 12, total: 0, total_pages: 0 },
  };
  let dictionaries: Awaited<ReturnType<typeof getDictionaries>> = { cities: [], subjects: [] };
  try {
    [data, dictionaries] = await Promise.all([getTutorsList(filters), getDictionaries()]);
  } catch (e) {
    console.error('catalog data fetch failed', e);
  }

  return (
    <CatalogLayout
      tutors={data.data}
      pagination={data.pagination}
      subjects={dictionaries.subjects}
      title={t('title')}
    />
  );
}
