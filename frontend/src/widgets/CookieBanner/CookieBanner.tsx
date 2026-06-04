'use client';

import { useEffect, useState } from 'react';

import { Link } from '@/i18n/routing';
import { ROUTES } from '@/shared/config/routes';

import styles from './CookieBanner.module.scss';

const STORAGE_KEY = 'cookie_consent_v1';

interface Consent {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) setShow(true);
    } catch {
      // localStorage unavailable; skip banner
    }
  }, []);

  const save = (consent: Consent) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    } catch {
      // ignore
    }
    setShow(false);
  };

  const acceptAll = () =>
    save({ necessary: true, analytics: true, marketing: true, timestamp: Date.now() });
  const acceptNecessary = () =>
    save({ necessary: true, analytics: false, marketing: false, timestamp: Date.now() });

  if (!show) return null;

  return (
    <div className={styles.banner} role="dialog" aria-label="Cookie consent">
      <div className={styles.body}>
        <p className={styles.text}>
          Мы используем cookies, чтобы сайт работал стабильно и стал удобнее. Подробнее —
          в{' '}
          <Link href={ROUTES.legal.cookie} className={styles.link}>
            политике cookies
          </Link>
          .
        </p>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={acceptNecessary}
          >
            Только необходимые
          </button>
          <button type="button" className={styles.btnPrimary} onClick={acceptAll}>
            Принять все
          </button>
        </div>
      </div>
    </div>
  );
}
