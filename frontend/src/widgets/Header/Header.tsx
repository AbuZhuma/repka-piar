'use client';

import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useAuth } from '@/features/auth';
import { FavoritesIndicator, useFavoritesStore } from '@/features/favorites';
import { Link } from '@/i18n/routing';
import { ROUTES } from '@/shared/config/routes';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';
import { Container } from '@/shared/ui/Container';
import { Logo } from '@/shared/ui/Logo';

import { CityPicker } from './CityPicker';
import styles from './Header.module.scss';
import { LangSwitcher } from './LangSwitcher';
import { ProfileMenu } from './ProfileMenu/ProfileMenu';

export function Header() {
  const t = useTranslations('navigation');
  const { isAuthenticated, user } = useAuth();
  const hydrateFavorites = useFavoritesStore((s) => s.hydrateForUser);
  const [open, setOpen] = useState(false);

  // Reconcile guest favorites with the server every time the auth user changes.
  useEffect(() => {
    void hydrateFavorites(user?.id ?? null);
  }, [user?.id, hydrateFavorites]);

  const navLinks = [
    { href: ROUTES.catalog, label: t('catalog') },
    { href: ROUTES.forStudents, label: t('for_students') },
    { href: ROUTES.forTutors, label: t('for_tutors') },
    { href: ROUTES.blog, label: t('blog') },
  ];

  return (
    <header className={styles.header}>
      <Container className={styles.inner}>
        <div className={styles.left}>
          <Link href={ROUTES.home} className={styles.logoLink} aria-label="Repka">
            <Logo size="md" />
          </Link>
          <div className={styles.cityWrap}>
            <CityPicker />
          </div>
        </div>

        <nav className={styles.nav} aria-label="Primary">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={styles.navItem}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className={styles.right}>
          <FavoritesIndicator />
          <div className={styles.langDesktop}>
            <LangSwitcher />
          </div>
          {isAuthenticated && user ? (
            <ProfileMenu />
          ) : (
            <>
              <Link href={ROUTES.becomeTutor} className={styles.ctaDesktop}>
                <Button variant="ghost" size="sm">
                  {t('become_tutor')}
                </Button>
              </Link>
              <Link href={ROUTES.register}>
                <Button variant="primary" size="sm">
                  {t('sign_up')}
                </Button>
              </Link>
            </>
          )}
          <button
            type="button"
            className={styles.burger}
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
          >
            <Menu size={24} />
          </button>
        </div>
      </Container>

      {open && (
        <div className={styles.mobileMenu}>
          <Container>
            <nav className={styles.mobileNav} aria-label="Mobile">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={styles.mobileItem}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={ROUTES.becomeTutor}
                className={styles.mobileItem}
                onClick={() => setOpen(false)}
              >
                {t('become_tutor')}
              </Link>
              {!isAuthenticated && (
                <>
                  <Link
                    href={ROUTES.register}
                    className={styles.mobileItem}
                    onClick={() => setOpen(false)}
                  >
                    {t('sign_up')}
                  </Link>
                  <Link
                    href={ROUTES.login}
                    className={styles.mobileItem}
                    onClick={() => setOpen(false)}
                  >
                    {t('login')}
                  </Link>
                </>
              )}
            </nav>
            <div className={cn(styles.mobileBottom)}>
              <LangSwitcher />
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
