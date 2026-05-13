'use client';

import { ImagePlus, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import {
  adminCreateAuthor,
  adminDeleteAuthor,
  adminListAuthors,
  adminUpdateAuthor,
  adminUploadMedia,
  type AdminAuthor,
} from '@/shared/api/admin';
import { assetUrl } from '@/shared/lib/format';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Textarea } from '@/shared/ui/Textarea';

import styles from './page.module.scss';

interface DraftAuthor {
  name: string;
  bio?: string;
  role?: string;
  avatar_url?: string;
}

function AvatarUpload({
  value,
  onChange,
}: {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = () => inputRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const item = await adminUploadMedia(file);
      onChange(item.url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className={styles.avatarField}>
      <span className={styles.avatarLabel}>Аватар</span>
      <div className={styles.avatarRow}>
        <div className={styles.avatarPreview}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={assetUrl(value) ?? value} alt="" />
          ) : (
            <ImagePlus size={22} />
          )}
        </div>
        <div className={styles.avatarActions}>
          <button
            type="button"
            onClick={pick}
            disabled={uploading}
            className={styles.avatarBtn}
          >
            {uploading ? 'Загрузка…' : value ? 'Заменить' : 'Загрузить фото'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className={styles.avatarRemove}
              aria-label="Убрать"
            >
              <X size={14} /> Убрать
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onFile}
        hidden
      />
      {error && <span className={styles.avatarError}>{error}</span>}
    </div>
  );
}

export default function AuthorsPage() {
  const [items, setItems] = useState<AdminAuthor[]>([]);
  const [draft, setDraft] = useState<DraftAuthor>({ name: '' });
  const [busy, setBusy] = useState(false);

  const reload = () => adminListAuthors().then(setItems);

  useEffect(() => {
    reload();
  }, []);

  const onCreate = async () => {
    if (!draft.name.trim()) return;
    setBusy(true);
    try {
      await adminCreateAuthor(draft);
      setDraft({ name: '' });
      reload();
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Удалить автора?')) return;
    try {
      await adminDeleteAuthor(id);
      reload();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    }
  };

  return (
    <div>
      <h1 className={styles.title}>Авторы статей</h1>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Создать нового</h3>
        <div className={styles.formGrid}>
          <Input
            label="ФИО"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <Input
            label="Должность"
            value={draft.role ?? ''}
            onChange={(e) => setDraft({ ...draft, role: e.target.value })}
          />
          <AvatarUpload
            value={draft.avatar_url}
            onChange={(url) => setDraft({ ...draft, avatar_url: url ?? undefined })}
          />
          <div className={styles.bioField}>
            <Textarea
              value={draft.bio ?? ''}
              onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
              rows={2}
              placeholder="Био"
            />
          </div>
        </div>
        <Button variant="primary" size="md" onClick={onCreate} loading={busy}>
          <Plus size={14} /> Добавить
        </Button>
      </div>

      <div className={styles.list}>
        {items.map((a) => (
          <AuthorCard key={a.id} author={a} onSave={reload} onDelete={() => onDelete(a.id)} />
        ))}
      </div>
    </div>
  );
}

function AuthorCard({
  author,
  onSave,
  onDelete,
}: {
  author: AdminAuthor;
  onSave: () => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(author);
  const dirty =
    draft.name !== author.name ||
    draft.role !== author.role ||
    draft.bio !== author.bio ||
    draft.avatar_url !== author.avatar_url;

  const save = async () => {
    await adminUpdateAuthor(author.id, draft);
    onSave();
  };

  return (
    <div className={styles.authorCard}>
      <Input
        label="ФИО"
        value={draft.name}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
      />
      <Input
        label="Должность"
        value={draft.role ?? ''}
        onChange={(e) => setDraft({ ...draft, role: e.target.value })}
      />
      <AvatarUpload
        value={draft.avatar_url}
        onChange={(url) => setDraft({ ...draft, avatar_url: url })}
      />
      <Textarea
        value={draft.bio ?? ''}
        onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
        rows={3}
        placeholder="Био"
      />
      <div className={styles.actions}>
        {dirty && (
          <Button variant="primary" size="sm" onClick={save}>
            Сохранить
          </Button>
        )}
        <button type="button" onClick={onDelete} className={styles.dangerBtn}>
          <Trash2 size={14} /> Удалить
        </button>
      </div>
    </div>
  );
}
