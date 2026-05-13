'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { LogOut, Settings, User } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useAuth } from '@/features/auth';
import { Link, useRouter } from '@/i18n/routing';
import { ROUTES } from '@/shared/config/routes';
import { Logo } from '@/shared/ui/Logo';

import styles from './CabinetHeader.module.scss';

export function CabinetHeader() {
  const t = useTranslations('cabinet.nav');
  const { user, logout } = useAuth();
  const router = useRouter();

  const onLogout = async () => {
    await logout();
    router.push(ROUTES.home);
  };

  const initials = user ? `${user.name.slice(0, 1)}${user.surname.slice(0, 1)}` : '';

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href={ROUTES.home} aria-label="Repka">
          <Logo size="md" />
        </Link>

        <div className={styles.right}>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger className={styles.avatar} aria-label="User menu">
              <span>{initials}</span>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className={styles.menu}
                align="end"
                sideOffset={6}
              >
                {user && (
                  <div className={styles.menuHead}>
                    <strong>
                      {user.name} {user.surname}
                    </strong>
                    <span>{user.email}</span>
                  </div>
                )}
                <DropdownMenu.Separator className={styles.sep} />
                <DropdownMenu.Item asChild>
                  <Link href="/cabinet/profile-page" className={styles.menuItem}>
                    <User size={16} /> {t('profile')}
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                  <Link href="/cabinet/settings" className={styles.menuItem}>
                    <Settings size={16} /> {t('settings')}
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className={styles.sep} />
                <DropdownMenu.Item
                  className={`${styles.menuItem} ${styles.danger}`}
                  onSelect={() => void onLogout()}
                >
                  <LogOut size={16} /> {t('logout')}
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </header>
  );
}
