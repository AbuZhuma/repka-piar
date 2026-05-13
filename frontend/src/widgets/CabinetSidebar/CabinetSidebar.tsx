'use client';

import { Eye, Home, HelpCircle, Settings, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

import { Link } from '@/i18n/routing';
import { ROUTES } from '@/shared/config/routes';
import { cn } from '@/shared/lib/cn';

import styles from './CabinetSidebar.module.scss';

interface CabinetSidebarProps {
  tutorSlug?: string | null;
}

export function CabinetSidebar({ tutorSlug }: CabinetSidebarProps) {
  const t = useTranslations('cabinet.nav');
  const pathname = usePathname() ?? '';

  const items = [
    { href: ROUTES.cabinet, icon: <Home size={18} />, label: t('dashboard') },
    {
      href: '/cabinet/profile-page',
      icon: <User size={18} />,
      label: t('profile'),
    },
    {
      href: '/cabinet/settings',
      icon: <Settings size={18} />,
      label: t('settings'),
    },
    {
      href: '/cabinet/support',
      icon: <HelpCircle size={18} />,
      label: t('support'),
    },
  ];

  const isActive = (href: string) => {
    const stripped = pathname.replace(/^\/(ru|kg|en)/, '') || '/';
    if (href === ROUTES.cabinet) return stripped === '/cabinet' || stripped === '/cabinet/';
    return stripped.startsWith(href);
  };

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav} aria-label="Cabinet">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(styles.item, isActive(item.href) && styles.active)}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </Link>
        ))}
      </nav>

      {tutorSlug && (
        <div className={styles.footer}>
          <a
            href={`/tutor/${tutorSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.publicLink}
          >
            <Eye size={14} />
            <span>{t('view_public')}</span>
          </a>
        </div>
      )}
    </aside>
  );
}
