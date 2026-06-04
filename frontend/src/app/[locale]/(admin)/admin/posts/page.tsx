'use client';

import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  adminDeletePost,
  adminDuplicatePost,
  adminListPosts,
  adminPublishPost,
  adminUnpublishPost,
  type AdminPostListItem,
  type Paginated,
} from '@/shared/api/admin';
import { Link } from '@/i18n/routing';
import { ROUTES } from '@/shared/config/routes';
import { Button } from '@/shared/ui/Button';
import { cn } from '@/shared/lib/cn';

import styles from './page.module.scss';

const STATUSES = ['all', 'published', 'draft', 'archived'] as const;

const STATUS_LABEL: Record<string, string> = {
  published: 'Опубликовано',
  draft: 'Черновик',
  archived: 'Архив',
};

export default function AdminPostsPage() {
  const [data, setData] = useState<Paginated<AdminPostListItem> | null>(null);
  const [status, setStatus] = useState<string>('all');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const reload = () => {
    setLoading(true);
    adminListPosts({
      status: status === 'all' ? undefined : status,
      q: q || undefined,
      limit: 50,
    })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, q]);

  const onPublishToggle = async (p: AdminPostListItem) => {
    if (p.status === 'published') await adminUnpublishPost(p.id);
    else await adminPublishPost(p.id);
    reload();
  };

  const onDuplicate = async (p: AdminPostListItem) => {
    await adminDuplicatePost(p.id);
    reload();
  };

  const onDelete = async (p: AdminPostListItem) => {
    if (!confirm(`Удалить статью "${p.title_ru}"?`)) return;
    await adminDeletePost(p.id);
    reload();
  };

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.title}>Статьи блога</h1>
        <Link href={ROUTES.admin.postNew}>
          <Button variant="primary" size="md">
            <Plus size={14} /> Новая статья
          </Button>
        </Link>
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
          placeholder="Поиск по заголовку"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={styles.search}
        />
      </div>

      <div className={styles.card}>
        {loading ? (
          <p className={styles.empty}>Загрузка...</p>
        ) : !data || data.data.length === 0 ? (
          <p className={styles.empty}>Статей не найдено</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Статья</th>
                <th>Категория</th>
                <th>Автор</th>
                <th>Статус</th>
                <th>Просмотры</th>
                <th>Опубликовано</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={ROUTES.admin.postEdit(p.id)} className={styles.titleCell}>
                      <strong>{p.title_ru}</strong>
                      <small>{p.slug}</small>
                    </Link>
                  </td>
                  <td>{p.category_name ?? '—'}</td>
                  <td>{p.author_name ?? '—'}</td>
                  <td>
                    <span className={cn(styles.status, styles[`status-${p.status}`])}>
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </td>
                  <td>{p.views_count}</td>
                  <td>
                    {p.published_at ? new Date(p.published_at).toLocaleDateString('ru-RU') : '—'}
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      <Link href={ROUTES.admin.postEdit(p.id)} className={styles.openBtn}>
                        Редактировать
                      </Link>
                      <button
                        type="button"
                        onClick={() => onPublishToggle(p)}
                        className={styles.linkBtn}
                      >
                        {p.status === 'published' ? 'Снять с публикации' : 'Опубликовать'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDuplicate(p)}
                        className={styles.linkBtn}
                      >
                        Дубль
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(p)}
                        className={cn(styles.linkBtn, styles.dangerBtn)}
                      >
                        Удалить
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
