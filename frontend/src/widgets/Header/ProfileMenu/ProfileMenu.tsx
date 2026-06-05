'use client';

import {
  ChevronDown,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Settings,
  UserRound,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { useAuth } from '@/features/auth';
import { Link, useRouter } from '@/i18n/routing';
import { ROUTES } from '@/shared/config/routes';
import { assetUrl } from '@/shared/lib/format';

import styles from './ProfileMenu.module.scss';

function initials(name?: string, surname?: string) {
  const a = (name ?? '').trim()[0] ?? '';
  const b = (surname ?? '').trim()[0] ?? '';
  return (a + b).toUpperCase() || '?';
}

export function ProfileMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const t = useTranslations('navigation');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  const isAdmin = user.roles.includes('admin');
  const isTutor = user.roles.includes('tutor');
  const avatarSrc = user.avatar_url ? assetUrl(user.avatar_url) ?? user.avatar_url : null;

  const onLogout = async () => {
    setOpen(false);
    await logout();
    router.push(ROUTES.home);
  };

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={user.name || user.email}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.avatar} aria-hidden>
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarSrc} alt="" />
          ) : (
            <span className={styles.initials}>{initials(user.name, user.surname)}</span>
          )}
        </span>
        <span className={styles.nameWrap}>
          <span className={styles.name}>{user.name || user.email}</span>
          <span className={styles.role}>
            {isAdmin ? 'Admin' : isTutor ? t('cabinet') : user.email}
          </span>
        </span>
        <ChevronDown size={14} className={styles.caret} />
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          <div className={styles.menuHead}>
            <span className={styles.avatar}>
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarSrc} alt="" />
              ) : (
                <span className={styles.initials}>{initials(user.name, user.surname)}</span>
              )}
            </span>
            <div>
              <span className={styles.headName}>
                {user.name} {user.surname}
              </span>
              <span className={styles.headEmail}>{user.email}</span>
            </div>
          </div>

          <nav className={styles.menuNav} aria-label="Profile">
            {/* Personal profile is available for everyone */}
            <Link href="/me" className={styles.menuItem} onClick={() => setOpen(false)}>
              <UserRound size={16} /> Мой профиль
            </Link>

            {isAdmin && (
              <Link
                href={ROUTES.admin.root}
                className={styles.menuItem}
                onClick={() => setOpen(false)}
              >
                <LayoutDashboard size={16} /> Админка
              </Link>
            )}
            {isTutor && (
              <Link
                href={ROUTES.cabinet}
                className={styles.menuItem}
                onClick={() => setOpen(false)}
              >
                <LayoutDashboard size={16} /> Кабинет репетитора
              </Link>
            )}
            {isTutor && (
              <Link
                href={ROUTES.cabinetProfile}
                className={styles.menuItem}
                onClick={() => setOpen(false)}
              >
                <UserRound size={16} /> Анкета репетитора
              </Link>
            )}
            <Link
              href={ROUTES.favorites}
              className={styles.menuItem}
              onClick={() => setOpen(false)}
            >
              <LifeBuoy size={16} /> Избранное
            </Link>
            {isTutor && (
              <Link
                href={ROUTES.cabinerSettings}
                className={styles.menuItem}
                onClick={() => setOpen(false)}
              >
                <Settings size={16} /> Настройки
              </Link>
            )}
            <Link
              href={ROUTES.support}
              className={styles.menuItem}
              onClick={() => setOpen(false)}
            >
              <LifeBuoy size={16} /> Поддержка
            </Link>
          </nav>

          <button type="button" onClick={onLogout} className={styles.logoutBtn}>
            <LogOut size={16} /> {t('logout')}
          </button>
        </div>
      )}
    </div>
  );
}
