'use client';

import { ExternalLink, LogOut, Shield } from 'lucide-react';

import { useAuth } from '@/features/auth';
import { Link, useRouter } from '@/i18n/routing';

import styles from './AdminHeader.module.scss';

export function AdminHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const onLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link href="/admin" className={styles.brand}>
          <Shield size={18} />
          <span>Repka Admin</span>
        </Link>
      </div>
      <div className={styles.right}>
        <a href="/" target="_blank" rel="noreferrer" className={styles.actionLink}>
          <ExternalLink size={14} />
          На сайт
        </a>
        {user && (
          <div className={styles.user}>
            <span className={styles.userName}>
              {user.name} {user.surname}
            </span>
            <span className={styles.userEmail}>{user.email}</span>
          </div>
        )}
        <button type="button" onClick={onLogout} className={styles.logoutBtn} aria-label="Выйти">
          <LogOut size={14} />
        </button>
      </div>
    </header>
  );
}
