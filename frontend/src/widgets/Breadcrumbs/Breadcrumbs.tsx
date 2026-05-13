import { ChevronRight } from 'lucide-react';
import { Fragment } from 'react';

import { Link } from '@/i18n/routing';

import styles from './Breadcrumbs.module.scss';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null;
  return (
    <nav className={styles.crumbs} aria-label="Breadcrumb">
      <ol className={styles.list}>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <Fragment key={`${item.label}-${idx}`}>
              <li className={styles.item}>
                {item.href && !isLast ? (
                  <Link href={item.href} className={styles.link}>
                    {item.label}
                  </Link>
                ) : (
                  <span className={styles.current}>{item.label}</span>
                )}
              </li>
              {!isLast && <ChevronRight size={14} className={styles.sep} aria-hidden />}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
