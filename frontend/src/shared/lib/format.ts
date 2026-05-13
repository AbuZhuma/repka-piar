import { env } from '@/shared/config/env';

export function assetUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  if (path.startsWith('/')) return `${env.apiUrl}${path}`;
  return `${env.apiUrl}/${path}`;
}

export function formatPrice(amount: number, currency: string = 'KGS', locale: string = 'ru'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(value: number, locale: string = 'ru'): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatDate(date: string | Date, locale: string = 'ru'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date, locale: string = 'ru'): string {
  const target = new Date(date).getTime();
  const now = Date.now();
  const diff = (target - now) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const ranges: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1],
  ];
  for (const [unit, secondsInUnit] of ranges) {
    if (Math.abs(diff) >= secondsInUnit || unit === 'second') {
      return rtf.format(Math.round(diff / secondsInUnit), unit);
    }
  }
  return rtf.format(0, 'second');
}
