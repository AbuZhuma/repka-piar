'use client';

import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  adminDeleteTutor,
  adminListTutors,
  type AdminTutorListItem,
  type Paginated,
} from '@/shared/api/admin';
import { Link } from '@/i18n/routing';
import { ROUTES } from '@/shared/config/routes';
import { assetUrl } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';

import styles from './page.module.scss';

const STATUS_LABEL: Record<string, string> = {
  active: 'Активен',
  pending: 'На проверке',
  pending_review: 'На проверке',
  rejected: 'Отклонён',
  inactive: 'Заблокирован',
};

const STATUSES = ['all', 'pending', 'active', 'rejected', 'inactive'] as const;

export default function AdminTutorsPage() {
  const [data, setData] = useState<Paginated<AdminTutorListItem> | null>(null);
  const [status, setStatus] = useState<string>('all');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const reload = () => {
    setLoading(true);
    adminListTutors({ status: status === 'all' ? undefined : status, q: q || undefined, limit: 50 })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, q]);

  const onDelete = async (t: AdminTutorListItem) => {
    setDeletingId(t.id);
    try {
      await adminDeleteTutor(t.id);
      reload();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Не удалось удалить');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.title}>Репетиторы</h1>
        {data && <span className={styles.count}>{data.pagination.total}</span>}
      </header>

      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={cn(styles.tab, status === s && styles.tabActive)}
            >
              {s === 'all' ? 'Все' : STATUS_LABEL[s] ?? s}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Поиск по имени или email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={styles.search}
        />
      </div>

      <div className={styles.card}>
        {loading ? (
          <p className={styles.empty}>Загрузка...</p>
        ) : !data || data.data.length === 0 ? (
          <p className={styles.empty}>Никого не найдено</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Репетитор</th>
                <th>Статус</th>
                <th>Опыт</th>
                <th>Просмотры</th>
                <th>Клики</th>
                <th>Подал</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className={styles.tutorCell}>
                      {t.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={assetUrl(t.photo_url) ?? t.photo_url}
                          alt=""
                          className={styles.avatar}
                        />
                      ) : (
                        <span className={styles.avatarFallback}>
                          {(t.name[0] ?? '').toUpperCase()}
                        </span>
                      )}
                      <div>
                        <strong>
                          {t.name} {t.surname}
                        </strong>
                        <small>{t.email}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={cn(styles.status, styles[`status-${t.status}`])}>
                      {STATUS_LABEL[t.status] ?? t.status}
                    </span>
                  </td>
                  <td>{t.experience_years} лет</td>
                  <td>{t.views_count}</td>
                  <td>{t.contact_clicks_count}</td>
                  <td>{new Date(t.created_at).toLocaleDateString('ru-RU')}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <Link href={ROUTES.admin.tutor(t.id)} className={styles.openBtn}>
                        Открыть
                      </Link>
                      <button
                        type="button"
                        onClick={() => onDelete(t)}
                        disabled={deletingId === t.id}
                        className={styles.deleteBtn}
                        aria-label="Удалить"
                        title="Удалить репетитора"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
