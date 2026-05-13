'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { DeleteAccountSection, SessionsList } from '@/features/account-settings';
import { changePassword, useAuth } from '@/features/auth';
import { getMyTutorProfile, type MyTutorProfile } from '@/features/cabinet-analytics';
import { ApiError } from '@/shared/lib/api';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';

import styles from './page.module.scss';

export default function CabinetSettingsPage() {
  const t = useTranslations('cabinet.settings');
  const tVerify = useTranslations('cabinet.verification');
  const { user } = useAuth();
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tutor, setTutor] = useState<MyTutorProfile | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyTutorProfile()
      .then((p) => {
        if (!cancelled) setTutor(p);
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (newPwd.length < 8) {
      setError(t('security.weak'));
      return;
    }
    if (newPwd !== confirmPwd) {
      setError(t('security.mismatch'));
      return;
    }
    setLoading(true);
    try {
      await changePassword(oldPwd, newPwd);
      setSuccess(true);
      setOldPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setError(t('security.wrong_old'));
      } else {
        setError(t('security.weak'));
      }
    } finally {
      setLoading(false);
    }
  };

  const status = tutor?.status;
  const verifyTitle = !status
    ? '—'
    : status === 'active'
      ? tVerify('active_title')
      : status === 'rejected'
        ? tVerify('rejected_title')
        : tVerify('pending_title');
  const verifyText = !status
    ? null
    : status === 'active'
      ? tVerify('active_text')
      : status === 'rejected'
        ? tVerify('rejected_text', { reason: tutor?.rejection_reason ?? '—' })
        : tVerify('pending_text');
  const verifyTone =
    status === 'active'
      ? 'ok'
      : status === 'rejected'
        ? 'error'
        : status
          ? 'pending'
          : null;

  return (
    <div className={styles.layout}>
      <h1 className={styles.title}>{t('title')}</h1>

      {verifyTone && (
        <section
          className={cn(
            styles.statusCard,
            verifyTone === 'ok' && styles.statusOk,
            verifyTone === 'pending' && styles.statusPending,
            verifyTone === 'error' && styles.statusError,
          )}
        >
          <strong>{verifyTitle}</strong>
          {verifyText && <p>{verifyText}</p>}
        </section>
      )}

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>{t('security.change_password_title')}</h2>
        <form className={styles.form} onSubmit={onSubmit}>
          <Input
            label={t('security.old_password')}
            type="password"
            autoComplete="current-password"
            value={oldPwd}
            onChange={(e) => setOldPwd(e.target.value)}
          />
          <Input
            label={t('security.new_password')}
            type="password"
            autoComplete="new-password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
          />
          <Input
            label={t('security.confirm_password')}
            type="password"
            autoComplete="new-password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
          />
          {error && <p className={styles.error}>{error}</p>}
          {success && <p className={styles.success}>✓ {t('security.success')}</p>}
          <Button type="submit" variant="primary" size="md" loading={loading}>
            {t('security.submit')}
          </Button>
        </form>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>{t('security.sessions_title')}</h2>
        <SessionsList />
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>{t('account.info_title')}</h2>
        {user ? (
          <dl className={styles.info}>
            <dt>{t('account.id')}</dt>
            <dd>{user.id}</dd>
            <dt>{t('account.registered')}</dt>
            <dd>{new Date(user.created_at).toLocaleDateString()}</dd>
            <dt>{t('account.verification')}</dt>
            <dd>{verifyTitle}</dd>
          </dl>
        ) : (
          <p className={styles.note}>—</p>
        )}
      </section>

      <DeleteAccountSection user={user} />
    </div>
  );
}
