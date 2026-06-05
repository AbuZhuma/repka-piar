'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useAuth, useAuthStore } from '@/features/auth';
import { Link, useRouter } from '@/i18n/routing';
import { verifyEmail } from '@/shared/api/me';
import { ROUTES } from '@/shared/config/routes';
import { Button } from '@/shared/ui/Button';

import styles from '../login/page.module.scss';

type State =
  | { kind: 'pending' }
  | { kind: 'success' }
  | { kind: 'error'; message: string };

export default function VerifyEmailPage() {
  const t = useTranslations('auth.verify');
  const params = useSearchParams();
  const token = params?.get('token') ?? '';
  const router = useRouter();
  const { user, setUser } = useAuth();
  const setStoreUser = useAuthStore((s) => s.setUser);
  const [state, setState] = useState<State>({ kind: 'pending' });
  const tried = useRef(false);

  useEffect(() => {
    if (tried.current) return;
    tried.current = true;
    if (!token) {
      setState({ kind: 'error', message: t('no_token') });
      return;
    }
    verifyEmail(token)
      .then(() => {
        setState({ kind: 'success' });
        if (user) {
          const updated = { ...user, email_verified: true };
          setUser(updated);
          setStoreUser(updated);
        }
      })
      .catch((e: Error) => {
        setState({ kind: 'error', message: e.message || t('failed') });
      });
  }, [token, t, user, setUser, setStoreUser]);

  return (
    <div className={styles.card}>
      {state.kind === 'pending' && (
        <>
          <h1 className={styles.title}>{t('verifying')}</h1>
          <p className={styles.subtitle}>{t('please_wait')}</p>
        </>
      )}

      {state.kind === 'success' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <CheckCircle2 size={56} color="#16a34a" />
          </div>
          <h1 className={styles.title}>{t('success_title')}</h1>
          <p className={styles.subtitle}>{t('success_body')}</p>
          <div style={{ marginTop: 24 }}>
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => router.push(user ? '/me' : ROUTES.login)}
            >
              {user ? t('go_to_profile') : t('go_to_login')}
            </Button>
          </div>
        </>
      )}

      {state.kind === 'error' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <XCircle size={56} color="#dc2626" />
          </div>
          <h1 className={styles.title}>{t('error_title')}</h1>
          <p className={styles.subtitle}>{state.message}</p>
          <div className={styles.links} style={{ marginTop: 16 }}>
            <Link href={user ? '/me' : ROUTES.login} className={styles.link}>
              {user ? t('go_to_profile') : t('go_to_login')}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
