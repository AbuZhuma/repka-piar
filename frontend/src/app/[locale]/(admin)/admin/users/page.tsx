'use client';

import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  adminBlockUser,
  adminDeleteUser,
  adminListUsers,
  adminSetUserRoles,
  adminUnblockUser,
  type AdminUserListItem,
  type Paginated,
} from '@/shared/api/admin';
import { useAuth } from '@/features/auth';
import { Button } from '@/shared/ui/Button';
import { cn } from '@/shared/lib/cn';

import styles from './page.module.scss';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [data, setData] = useState<Paginated<AdminUserListItem> | null>(null);
  const [q, setQ] = useState('');
  const [role, setRole] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const reload = () => {
    setLoading(true);
    adminListUsers({
      q: q || undefined,
      role: role === 'all' ? undefined : role,
      limit: 100,
    })
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, role]);

  const onBlock = async (u: AdminUserListItem) => {
    if (u.is_blocked) await adminUnblockUser(u.id);
    else {
      if (!confirm(`Заблокировать ${u.email}?`)) return;
      await adminBlockUser(u.id);
    }
    reload();
  };

  const onDelete = async (u: AdminUserListItem) => {
    if (currentUser?.id === u.id) {
      alert('Нельзя удалить собственный аккаунт');
      return;
    }
    const label = u.name ? `${u.name} ${u.surname} (${u.email})` : u.email;
    if (
      !confirm(
        `Удалить пользователя ${label}?\n\nЭто действие нельзя отменить. Будет удалён аккаунт, профиль репетитора (если есть) и история сессий.`,
      )
    )
      return;
    setDeletingId(u.id);
    try {
      await adminDeleteUser(u.id);
      reload();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Не удалось удалить');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleAdmin = async (u: AdminUserListItem) => {
    const isAdmin = u.roles.includes('admin');
    const next = isAdmin ? u.roles.filter((r) => r !== 'admin') : [...u.roles, 'admin'];
    if (
      !confirm(
        isAdmin
          ? `Снять права администратора с ${u.email}?`
          : `Сделать ${u.email} администратором?`,
      )
    )
      return;
    await adminSetUserRoles(u.id, next);
    reload();
  };

  return (
    <div>
      <h1 className={styles.title}>Пользователи</h1>

      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          {['all', 'tutor', 'admin'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(styles.tab, role === r && styles.tabActive)}
            >
              {r === 'all' ? 'Все' : r === 'tutor' ? 'Репетиторы' : 'Админы'}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Поиск по email, имени, телефону"
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
                <th>Пользователь</th>
                <th>Email / Phone</th>
                <th>Роли</th>
                <th>Статус</th>
                <th>Профиль</th>
                <th>Регистрация</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>
                      {u.name} {u.surname}
                    </strong>
                  </td>
                  <td>
                    <small>{u.email}</small>
                    <br />
                    <small>{u.phone}</small>
                  </td>
                  <td>
                    {u.roles.map((r) => (
                      <span key={r} className={styles.role}>
                        {r}
                      </span>
                    ))}
                  </td>
                  <td>
                    {u.is_blocked ? (
                      <span className={cn(styles.status, styles.statusBlocked)}>
                        Заблокирован
                      </span>
                    ) : (
                      <span className={cn(styles.status, styles.statusActive)}>Активен</span>
                    )}
                  </td>
                  <td>{u.has_tutor_profile ? 'Репетитор' : '—'}</td>
                  <td>{new Date(u.created_at).toLocaleDateString('ru-RU')}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <Button variant="ghost" size="sm" onClick={() => toggleAdmin(u)}>
                        {u.roles.includes('admin') ? 'Снять admin' : 'Сделать admin'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onBlock(u)}>
                        {u.is_blocked ? 'Разблокировать' : 'Заблокировать'}
                      </Button>
                      {currentUser?.id !== u.id && (
                        <button
                          type="button"
                          onClick={() => onDelete(u)}
                          disabled={deletingId === u.id}
                          className={styles.deleteBtn}
                          aria-label="Удалить"
                          title="Удалить пользователя"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
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
