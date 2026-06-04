'use client';

import { Eye, Home, HelpCircle, Settings, User, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

import { Link } from '@/i18n/routing';
import { ROUTES } from '@/shared/config/routes';
import { cn } from '@/shared/lib/cn';

import styles from './CabinetSidebar.module.scss';

interface CabinetSidebarProps {
  tutorSlug?: string | null;
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function CabinetSidebar({ tutorSlug, mobileOpen, onClose }: CabinetSidebarProps) {
  const t = useTranslations('cabinet.nav');
  const pathname = usePathname() ?? '';

  const items = [
    { href: ROUTES.cabinet, icon: <Home size={18} />, label: t('dashboard') },
    {
      href: ROUTES.cabinetProfile,
      icon: <User size={18} />,
      label: t('profile'),
    },
    {
      href: ROUTES.cabinerSettings,
      icon: <Settings size={18} />,
      label: t('settings'),
    },
    {
      href: ROUTES.cabinetSuport,
      icon: <HelpCircle size={18} />,
      label: t('support'),
    },
  ];

  const isActive = (href: string) => {
    const stripped = pathname.replace(/^\/(ru|kg|en)/, '') || '/';
    if (href === ROUTES.cabinet) return stripped === '/cabinet' || stripped === '/cabinet/';
    return stripped.startsWith(href);
  };

  const nav = (
    <nav className={styles.nav} aria-label="Cabinet">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(styles.item, isActive(item.href) && styles.active)}
          onClick={onClose}
        >
          <span className={styles.icon}>{item.icon}</span>
          <span className={styles.label}>{item.label}</span>
        </Link>
      ))}
    </nav>
  );

  const footer = tutorSlug && (
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
  );

  return (
    <>
      <aside className={styles.sidebar} aria-label="Cabinet navigation">
        {nav}
        {footer}
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(styles.overlay, mobileOpen && styles.overlayOpen)}
        onClick={onClose}
        aria-hidden={!mobileOpen}
      />
      <aside
        className={cn(styles.drawer, mobileOpen && styles.drawerOpen)}
        aria-hidden={!mobileOpen}
      >
        <div className={styles.drawerHead}>
          <span className={styles.drawerTitle}>Меню</span>
          <button
            type="button"
            onClick={onClose}
            className={styles.drawerClose}
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </div>
        {nav}
        {footer}
      </aside>
    </>
  );
}
