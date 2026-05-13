'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  adminCreateCategory,
  adminDeleteCategory,
  adminListCategories,
  adminUpdateCategory,
  type AdminCategory,
} from '@/shared/api/admin';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';

import styles from './page.module.scss';

export default function CategoriesPage() {
  const [items, setItems] = useState<AdminCategory[]>([]);
  const [draft, setDraft] = useState<{
    slug: string;
    name_ru: string;
    name_kg?: string;
    name_en?: string;
  }>({ slug: '', name_ru: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = () => adminListCategories().then(setItems);

  useEffect(() => {
    reload();
  }, []);

  const onCreate = async () => {
    if (!draft.slug || !draft.name_ru) return;
    setBusy(true);
    setError(null);
    try {
      await adminCreateCategory(draft);
      setDraft({ slug: '', name_ru: '' });
      reload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  const onUpdate = async (item: AdminCategory) => {
    await adminUpdateCategory(item.id, item);
    reload();
  };

  const onDelete = async (id: string) => {
    if (!confirm('Удалить категорию?')) return;
    try {
      await adminDeleteCategory(id);
      reload();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    }
  };

  return (
    <div>
      <h1 className={styles.title}>Категории блога</h1>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Создать новую</h3>
        <div className={styles.formRow}>
          <Input
            label="Slug"
            value={draft.slug}
            onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
          />
          <Input
            label="Название (RU)"
            value={draft.name_ru}
            onChange={(e) => setDraft({ ...draft, name_ru: e.target.value })}
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
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <Button variant="primary" size="md" onClick={onCreate} loading={busy}>
          <Plus size={14} /> Добавить
        </Button>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Все категории ({items.length})</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Slug</th>
              <th>RU</th>
              <th>KG</th>
              <th>EN</th>
              <th>Активна</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <CategoryRow
                key={it.id}
                item={it}
                onSave={onUpdate}
                onDelete={() => onDelete(it.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoryRow({
  item,
  onSave,
  onDelete,
}: {
  item: AdminCategory;
  onSave: (item: AdminCategory) => Promise<void>;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(item);
  const dirty = JSON.stringify(draft) !== JSON.stringify(item);
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
          type="checkbox"
          checked={draft.is_active}
          onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
        />
      </td>
      <td>
        <div className={styles.cellActions}>
          {dirty && (
            <button
              type="button"
              onClick={() => onSave(draft)}
              className={styles.saveBtn}
            >
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
