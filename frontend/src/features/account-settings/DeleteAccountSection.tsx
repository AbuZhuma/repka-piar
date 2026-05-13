'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { deleteAccount, useAuthStore } from '@/features/auth';
import { useRouter } from '@/i18n/routing';
import { ROUTES } from '@/shared/config/routes';
import { ApiError } from '@/shared/lib/api';
import { auth } from '@/shared/lib/auth';
import type { AuthUser } from '@/shared/types';
import { Button } from '@/shared/ui/Button';
import { Checkbox } from '@/shared/ui/Checkbox';
import { Input } from '@/shared/ui/Input';
import { Modal } from '@/shared/ui/Modal';
import { Textarea } from '@/shared/ui/Textarea';

import styles from './DeleteAccountSection.module.scss';

interface DeleteAccountSectionProps {
  user: AuthUser | null;
}

export function DeleteAccountSection({ user }: DeleteAccountSectionProps) {
  const t = useTranslations('cabinet.settings.account');
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setEmail('');
    setPassword('');
    setReason('');
    setConfirmed(false);
    setError(null);
    setSuccess(false);
  };

  const onOpenChange = (next: boolean) => {
    if (!loading && !next) reset();
    setOpen(next);
  };

  const canSubmit =
    confirmed &&
    !!user &&
    email.trim().toLowerCase() === user.email.toLowerCase() &&
    password.length > 0 &&
    !loading;

  const onSubmit = async () => {
    if (!user) return;
    if (email.trim().toLowerCase() !== user.email.toLowerCase()) {
      setError(t('delete_email_mismatch'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await deleteAccount(password, reason || undefined);
      setSuccess(true);
      auth.clear();
      setUser(null);
      setTimeout(() => {
        router.push(ROUTES.home);
      }, 1500);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setError(t('delete_wrong_password'));
      } else {
        setError(t('delete_generic_error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{t('delete_title')}</h2>
      <p className={styles.note}>{t('delete_text')}</p>
      <Button variant="danger" size="md" onClick={() => setOpen(true)} disabled={!user}>
        {t('delete_button')}
      </Button>

      <Modal open={open} onOpenChange={onOpenChange} title={t('delete_modal_title')} size="md">
        {success ? (
          <p className={styles.success}>✓ {t('delete_success')}</p>
        ) : (
          <div className={styles.body}>
            <p className={styles.warning}>{t('delete_modal_warning')}</p>

            <Input
              label={t('delete_confirm_email_label')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              hint={user?.email}
              autoComplete="off"
            />

            <Input
              label={t('delete_password_label')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            <Textarea
              label={t('delete_reason_label')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />

            <Checkbox
              label={t('delete_confirm_check')}
              checked={confirmed}
              onCheckedChange={(v) => setConfirmed(v === true)}
            />

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.actions}>
              <Button
                variant="ghost"
                size="md"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                {t('delete_cancel')}
              </Button>
              <Button
                variant="danger"
                size="md"
                disabled={!canSubmit}
                loading={loading}
                onClick={() => void onSubmit()}
              >
                {t('delete_submit')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
