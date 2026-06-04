'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { LogOut, Menu, Settings, User } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useAuth } from '@/features/auth';
import { Link, useRouter } from '@/i18n/routing';
import { ROUTES } from '@/shared/config/routes';
import { assetUrl } from '@/shared/lib/format';
import { Logo } from '@/shared/ui/Logo';

import styles from './CabinetHeader.module.scss';

interface CabinetHeaderProps {
  onMenuClick?: () => void;
}

export function CabinetHeader({ onMenuClick }: CabinetHeaderProps = {}) {
  const t = useTranslations('cabinet.nav');
  const { user, logout } = useAuth();
  const router = useRouter();

  const onLogout = async () => {
    await logout();
    router.push(ROUTES.home);
  };

  const initials = user ? `${user.name.slice(0, 1)}${user.surname.slice(0, 1)}` : '';
  const avatarSrc = user?.avatar_url
    ? assetUrl(user.avatar_url) ?? user.avatar_url
    : null;

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.left}>
          {onMenuClick && (
            <button
              type="button"
              className={styles.menuBtn}
              onClick={onMenuClick}
              aria-label="Меню"
            >
              <Menu size={22} />
            </button>
          )}
          <Link href={ROUTES.home} aria-label="Repka">
            <Logo size="md" />
          </Link>
        </div>

        <div className={styles.right}>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger className={styles.avatar} aria-label="User menu">
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarSrc} alt="" className={styles.avatarImg} />
              ) : (
                <span>{initials}</span>
              )}
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className={styles.menu}
                align="end"
                sideOffset={6}
              >
                {user && (
                  <div className={styles.menuHead}>
                    <span className={styles.menuAvatar} aria-hidden>
                      {avatarSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarSrc} alt="" />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </span>
                    <div>
                      <strong>
                        {user.name} {user.surname}
                      </strong>
                      <span>{user.email}</span>
                    </div>
                  </div>
                )}
                <DropdownMenu.Separator className={styles.sep} />
                <DropdownMenu.Item asChild>
                  <Link href={ROUTES.cabinetProfile} className={styles.menuItem}>
                    <User size={16} /> {t('profile')}
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                  <Link href={ROUTES.cabinerSettings} className={styles.menuItem}>
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
