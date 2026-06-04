import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getTutorsList } from '@/entities/tutor';
import type { CatalogFilters } from '@/entities/tutor/model/types';
import { getDictionaries } from '@/shared/api/dictionaries';
import { SITE, buildAlternates } from '@/shared/config/site';
import { generateItemListSchema, jsonLdScript } from '@/shared/lib/seo';
import { CatalogLayout } from '@/widgets/CatalogLayout';

export const dynamic = 'force-dynamic';

const GOAL_LABEL: Record<string, string> = {
  exam_ort: 'подготовка к ОРТ',
  exam_ege: 'подготовка к ЕГЭ',
  exam_ielts: 'подготовка к IELTS',
  exam_toefl: 'подготовка к TOEFL',
  exam_sat: 'подготовка к SAT',
  school: 'школьная программа',
  beginner: 'для начинающих',
  improve_grades: 'улучшение оценок',
  olympiad: 'олимпиадная подготовка',
  self: 'для себя',
  business: 'деловой английский',
};

const FORMAT_LABEL: Record<string, string> = {
  online: 'онлайн',
  at_tutor: 'у репетитора',
  at_student: 'у ученика',
};

function describeFilters(sp: Record<string, string | string[] | undefined>): {
  title: string;
  description: string;
  hasFilters: boolean;
} {
  const get = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const subject = get('subject');
  const goal = get('goal');
  const city = get('city');
  const format = get('format');
  const q = get('q');

  const parts: string[] = [];
  if (subject) parts.push(`по предмету «${subject}»`);
  if (goal && GOAL_LABEL[goal]) parts.push(GOAL_LABEL[goal]);
  if (format && FORMAT_LABEL[format]) parts.push(`формат: ${FORMAT_LABEL[format]}`);
  if (city) parts.push(`в городе ${city}`);
  if (q) parts.push(`по запросу «${q}»`);

  const hasFilters = parts.length > 0;
  const suffix = hasFilters ? ` ${parts.join(', ')}` : '';
  const title = hasFilters
    ? `Каталог репетиторов${suffix} — ${SITE.name}`
    : `Каталог репетиторов в Кыргызстане — ${SITE.name}`;
  const description = hasFilters
    ? `Подборка проверенных репетиторов${suffix}. Прямые контакты, прозрачные цены, без комиссий. Свяжитесь с педагогом напрямую через ${SITE.name}.`
    : 'Полный каталог проверенных репетиторов Кыргызстана. Фильтры по предметам, целям, формату занятий, городу и бюджету. Прямые контакты, без комиссий и посредников.';
  return { title, description, hasFilters };
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { locale } = await params;
  const sp = await searchParams;
  const { title, description, hasFilters } = describeFilters(sp);

  return {
    title: { absolute: title },
    description,
    // Filtered variants are crawlable but не приоритетные — canonical ведёт на чистый /catalog
    alternates: buildAlternates(locale, '/catalog'),
    robots: hasFilters ? { index: true, follow: true } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE.url}/${locale}/catalog`,
    },
    twitter: { title, description },
  };
}

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
    <>
      <CatalogLayout
        tutors={data.data}
        pagination={data.pagination}
        subjects={dictionaries.subjects}
        title={t('title')}
      />
      {data.data.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdScript(generateItemListSchema(data.data)),
          }}
        />
      )}
    </>
  );
}
