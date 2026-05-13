'use client';

import { useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';

import { Link, usePathname, routing } from '@/i18n/routing';
import { cn } from '@/shared/lib/cn';

import styles from './LangSwitcher.module.scss';

export function LangSwitcher() {
  const t = useTranslations('languages');
  const pathname = usePathname();
  const search = useSearchParams();
  const params = useParams<{ locale?: string }>();
  const current = params.locale ?? routing.defaultLocale;
  const queryString = search?.toString();
  const href = queryString ? `${pathname}?${queryString}` : pathname;

  return (
    <nav className={styles.switcher} aria-label="Language">
      {routing.locales.map((loc) => (
        <Link
          key={loc}
          href={href}
          locale={loc}
          className={cn(styles.item, current === loc && styles.active)}
          aria-current={current === loc ? 'true' : undefined}
        >
          <span className={styles.code}>{loc.toUpperCase()}</span>
          <span className={styles.label}>{t(loc)}</span>
        </Link>
      ))}
    </nav>
  );
}
