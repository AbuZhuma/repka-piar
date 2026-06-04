export const SITE = {
  name: 'Repka',
  legalName: 'Repka',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://repka.kg',
  description:
    'Маркетплейс репетиторов в Кыргызстане. Подготовка к ОРТ, IELTS, TOEFL, ЕГЭ, ' +
    'школьная программа и подготовка к поступлению — без комиссий и посредников.',
  shortDescription:
    'Найдите репетитора в Кыргызстане. Прямые контакты, прозрачные цены, 0% комиссии.',
  ogImage: '/opengraph-image',
  twitter: '@repka_kg',
  telegram: 'https://t.me/repka_kg',
  email: 'support@repka.kg',
  phone: '+996 555 000 000',
  themeColor: '#ee7c4e',
  locale: {
    default: 'ru',
    supported: ['ru', 'kg', 'en'] as const,
    /** Хёфланг-коды, совпадающие с пользовательскими локалями */
    hreflang: {
      ru: 'ru-KG',
      kg: 'ky-KG',
      en: 'en-US',
      'x-default': 'ru-KG',
    } as Record<string, string>,
  },
  /** ISO 3166-1 alpha-2 страны таргетинга */
  country: 'KG',
  city: 'Бишкек',
} as const;

export type SupportedLocale = (typeof SITE.locale.supported)[number];

export function absoluteUrl(path: string): string {
  if (!path) return SITE.url;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (!path.startsWith('/')) path = `/${path}`;
  return `${SITE.url}${path}`;
}

export function localePath(locale: string, path: string): string {
  const clean = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${clean}`;
}

/**
 * Builds the `alternates` block for next.js Metadata: canonical URL for the
 * current locale + hreflang alternates for the other locales. Pass relative
 * path without locale (e.g. `/catalog`, `/tutor/abdy`).
 */
export function buildAlternates(currentLocale: string, path: string) {
  const languages: Record<string, string> = {};
  for (const loc of SITE.locale.supported) {
    languages[SITE.locale.hreflang[loc] ?? loc] = absoluteUrl(localePath(loc, path));
  }
  languages['x-default'] = absoluteUrl(localePath(SITE.locale.default, path));
  return {
    canonical: absoluteUrl(localePath(currentLocale, path)),
    languages,
  };
}
