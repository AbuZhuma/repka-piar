'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  adminCreateCity,
  adminDeleteCity,
  adminListCities,
  adminUpdateCity,
  type AdminCity,
} from '@/shared/api/admin';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';

import styles from './page.module.scss';

interface Draft {
  slug: string;
  name_ru: string;
  name_kg?: string;
  name_en?: string;
  timezone?: string;
  is_active: boolean;
}

const EMPTY_DRAFT: Draft = {
  slug: '',
  name_ru: '',
  name_kg: '',
  name_en: '',
  timezone: 'Asia/Bishkek',
  is_active: true,
};

export default function CitiesPage() {
  const [items, setItems] = useState<AdminCity[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    setLoading(true);
    adminListCities()
      .then(setItems)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, []);

  const onCreate = async () => {
    if (!draft.slug.trim() || !draft.name_ru.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await adminCreateCity(draft);
      setDraft(EMPTY_DRAFT);
      reload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id: string, name: string) => {
    if (!confirm(`Удалить город «${name}»?`)) return;
    try {
      await adminDeleteCity(id);
      reload();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    }
  };

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.title}>Города</h1>
        <span className={styles.count}>{items.length}</span>
      </header>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Добавить новый</h3>
        <div className={styles.formGrid}>
          <Input
            label="Slug"
            value={draft.slug}
            onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
            placeholder="bishkek"
          />
          <Input
            label="Название (RU)"
            value={draft.name_ru}
            onChange={(e) => setDraft({ ...draft, name_ru: e.target.value })}
            placeholder="Бишкек"
          />
          <Input
            label="Название (KG)"
            value={draft.name_kg ?? ''}
            onChange={(e) => setDraft({ ...draft, name_kg: e.target.value })}
          />
          <Input
            label="Название (EN)"
            value={draft.name_en ?? ''}
            onChange={(e) => setDraft({ ...draft, name_en: e.target.value })}
          />
          <Input
            label="Часовой пояс"
            value={draft.timezone ?? ''}
            onChange={(e) => setDraft({ ...draft, timezone: e.target.value })}
          />
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <Button variant="primary" size="md" onClick={onCreate} loading={busy}>
          <Plus size={14} /> Добавить
        </Button>
      </section>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Все города</h3>
        {loading ? (
          <p className={styles.empty}>Загрузка…</p>
        ) : items.length === 0 ? (
          <p className={styles.empty}>Городов пока нет</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Slug</th>
                <th>RU</th>
                <th>KG</th>
                <th>EN</th>
                <th>Timezone</th>
                <th>Активен</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <CityRow
                  key={it.id}
                  item={it}
                  onSaved={reload}
                  onDelete={() => onDelete(it.id, it.name_ru)}
                />
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function CityRow({
  item,
  onSaved,
  onDelete,
}: {
  item: AdminCity;
  onSaved: () => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(item);
  const [toggling, setToggling] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(item);

  const save = async () => {
    await adminUpdateCity(item.id, draft);
    onSaved();
  };

  const toggleActive = async (next: boolean) => {
    setToggling(true);
    setDraft((d) => ({ ...d, is_active: next }));
    try {
      await adminUpdateCity(item.id, { ...item, is_active: next });
      onSaved();
    } catch (e: unknown) {
      setDraft((d) => ({ ...d, is_active: !next }));
      alert(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setToggling(false);
    }
  };

  return (
    <tr>
      <td>
        <input
          className={styles.cellInput}
          value={draft.slug}
          onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
        />
      </td>
      <td>
        <input
          className={styles.cellInput}
          value={draft.name_ru}
          onChange={(e) => setDraft({ ...draft, name_ru: e.target.value })}
        />
      </td>
      <td>
        <input
          className={styles.cellInput}
          value={draft.name_kg ?? ''}
          onChange={(e) => setDraft({ ...draft, name_kg: e.target.value })}
        />
      </td>
      <td>
        <input
          className={styles.cellInput}
          value={draft.name_en ?? ''}
          onChange={(e) => setDraft({ ...draft, name_en: e.target.value })}
        />
      </td>
      <td>
        <input
          className={styles.cellInput}
          value={draft.timezone}
          onChange={(e) => setDraft({ ...draft, timezone: e.target.value })}
        />
      </td>
      <td>
        <input
          type="checkbox"
          checked={draft.is_active}
          disabled={toggling}
          onChange={(e) => void toggleActive(e.target.checked)}
        />
      </td>
      <td>
        <div className={styles.cellActions}>
          {dirty && (
            <button type="button" onClick={save} className={styles.saveBtn}>
              Сохранить
            </button>
          )}
          <button type="button" onClick={onDelete} className={styles.dangerBtn}>
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}
