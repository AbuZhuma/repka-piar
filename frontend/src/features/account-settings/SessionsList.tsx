'use client';

import { Monitor, Smartphone, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { listSessions, revokeSession, type AuthSession } from '@/features/auth';
import { auth } from '@/shared/lib/auth';
import { ApiError } from '@/shared/lib/api';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';

import styles from './SessionsList.module.scss';

function isMobileUA(ua: string | null): boolean {
  if (!ua) return false;
  return /Mobile|Android|iPhone|iPad/i.test(ua);
}

function shortUserAgent(ua: string | null, fallback: string): string {
  if (!ua) return fallback;
  // Pull out browser + OS
  const browser =
    /OPR|Opera/.exec(ua)?.[0] ??
    /Edg/.exec(ua)?.[0] ??
    /Chrome/.exec(ua)?.[0] ??
    /Firefox/.exec(ua)?.[0] ??
    /Safari/.exec(ua)?.[0] ??
    fallback;
  const os =
    /Windows NT \d+\.\d+/.exec(ua)?.[0] ??
    /Mac OS X [\d_]+/.exec(ua)?.[0]?.replace(/_/g, '.') ??
    /Android \d+/.exec(ua)?.[0] ??
    /iPhone OS [\d_]+/.exec(ua)?.[0]?.replace(/_/g, '.') ??
    /Linux/.exec(ua)?.[0] ??
    '';
  return os ? `${browser} · ${os}` : browser;
}

export function SessionsList() {
  const t = useTranslations('cabinet.settings.security');
  const [sessions, setSessions] = useState<AuthSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const reload = async () => {
    setError(null);
    try {
      const list = await listSessions(auth.getRefresh());
      setSessions(list);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('sessions_revoke_failed'));
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    setError(null);
    try {
      await revokeSession(id);
      setSessions((prev) => (prev ? prev.filter((s) => s.id !== id) : prev));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('sessions_revoke_failed'));
    } finally {
      setRevoking(null);
    }
  };

  if (sessions === null) {
    return <p className={styles.note}>{t('sessions_loading')}</p>;
  }

  if (sessions.length === 0) {
    return <p className={styles.note}>{t('sessions_empty')}</p>;
  }

  return (
    <div className={styles.wrap}>
      {error && <p className={styles.error}>{error}</p>}
      <ul className={styles.list}>
        {sessions.map((session) => {
          const Icon = isMobileUA(session.user_agent) ? Smartphone : Monitor;
          const label = shortUserAgent(session.user_agent, t('sessions_unknown_device'));
          return (
            <li key={session.id} className={cn(styles.row, session.is_current && styles.rowActive)}>
              <span className={styles.icon}>
                <Icon size={18} />
              </span>
              <div className={styles.info}>
                <strong className={styles.label}>{label}</strong>
                <span className={styles.meta}>
                  {t('sessions_started', {
                    date: new Date(session.created_at).toLocaleString(),
                  })}
                  {session.ip_address ? ` · ${t('sessions_ip', { ip: session.ip_address })}` : ''}
                </span>
              </div>
              {session.is_current ? (
                <span className={styles.currentBadge}>{t('sessions_current')}</span>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  loading={revoking === session.id}
                  leftIcon={<Trash2 size={14} />}
                  onClick={() => void handleRevoke(session.id)}
                >
                  {t('sessions_revoke')}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
