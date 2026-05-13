'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  adminCreateSubject,
  adminDeleteSubject,
  adminListSubjects,
  adminUpdateSubject,
  type AdminSubject,
} from '@/shared/api/admin';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';

import styles from './page.module.scss';

interface Draft {
  slug: string;
  name_ru: string;
  name_kg?: string;
  name_en?: string;
  icon?: string;
  category?: string;
  sort_order: number;
}

const EMPTY_DRAFT: Draft = {
  slug: '',
  name_ru: '',
  name_kg: '',
  name_en: '',
  icon: '',
  category: '',
  sort_order: 0,
};

export default function SubjectsPage() {
  const [items, setItems] = useState<AdminSubject[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    setLoading(true);
    adminListSubjects()
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
      await adminCreateSubject(draft);
      setDraft(EMPTY_DRAFT);
      reload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id: string, name: string) => {
    if (!confirm(`Удалить предмет «${name}»?`)) return;
    try {
      await adminDeleteSubject(id);
      reload();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    }
  };

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.title}>Предметы</h1>
        <span className={styles.count}>{items.length}</span>
      </header>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Добавить новый</h3>
        <div className={styles.formGrid}>
          <Input
            label="Slug"
            value={draft.slug}
            onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
            placeholder="math"
          />
          <Input
            label="Название (RU)"
            value={draft.name_ru}
            onChange={(e) => setDraft({ ...draft, name_ru: e.target.value })}
            placeholder="Математика"
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
            label="Иконка (emoji)"
            value={draft.icon ?? ''}
            onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
            placeholder="🔢"
          />
          <Input
            label="Категория"
            value={draft.category ?? ''}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            placeholder="exact"
          />
          <Input
            label="Порядок"
            type="number"
            value={String(draft.sort_order)}
            onChange={(e) =>
              setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })
            }
          />
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <Button variant="primary" size="md" onClick={onCreate} loading={busy}>
          <Plus size={14} /> Добавить
        </Button>
      </section>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Все предметы</h3>
        {loading ? (
          <p className={styles.empty}>Загрузка…</p>
        ) : items.length === 0 ? (
          <p className={styles.empty}>Предметов пока нет</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Иконка</th>
                <th>Slug</th>
                <th>RU</th>
                <th>KG</th>
                <th>EN</th>
                <th>Категория</th>
                <th>Порядок</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <SubjectRow
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

function SubjectRow({
  item,
  onSaved,
  onDelete,
}: {
  item: AdminSubject;
  onSaved: () => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(item);
  const dirty = JSON.stringify(draft) !== JSON.stringify(item);

  const save = async () => {
    await adminUpdateSubject(item.id, draft);
    onSaved();
  };

  return (
    <tr>
      <td>
        <input
          className={styles.cellInputNarrow}
          value={draft.icon ?? ''}
          onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
        />
      </td>
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
          value={draft.category ?? ''}
          onChange={(e) => setDraft({ ...draft, category: e.target.value })}
        />
      </td>
      <td>
        <input
          type="number"
          className={styles.cellInputNarrow}
          value={String(draft.sort_order)}
          onChange={(e) =>
            setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })
          }
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
