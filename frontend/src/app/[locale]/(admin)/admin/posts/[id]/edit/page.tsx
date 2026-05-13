'use client';

import { ArrowLeft, ExternalLink } from 'lucide-react';
import { use, useEffect, useState } from 'react';

import {
  adminGetPost,
  adminListAuthors,
  adminListCategories,
  adminPublishPost,
  adminUnpublishPost,
  adminUpdatePost,
  adminUploadMedia,
  type AdminAuthor,
  type AdminCategory,
  type AdminPost,
} from '@/shared/api/admin';
import { Link } from '@/i18n/routing';
import type { Block } from '@/entities/post';
import { PostEditor } from '@/features/post-editor';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Textarea } from '@/shared/ui/Textarea';
import { assetUrl } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';

import styles from './page.module.scss';

interface Props {
  params: Promise<{ id: string }>;
}

type Tab = 'general' | 'seo' | 'locales';

export default function EditPostPage({ params }: Props) {
  const { id } = use(params);
  const [post, setPost] = useState<AdminPost | null>(null);
  const [draft, setDraft] = useState<AdminPost | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [authors, setAuthors] = useState<AdminAuthor[]>([]);
  const [tab, setTab] = useState<Tab>('general');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const [p, cats, auts] = await Promise.all([
        adminGetPost(id),
        adminListCategories().catch(() => []),
        adminListAuthors().catch(() => []),
      ]);
      setPost(p);
      setDraft(p);
      setCategories(cats as AdminCategory[]);
      setAuthors(auts as AdminAuthor[]);
    })();
  }, [id]);

  if (!draft || !post) return <div className={styles.loading}>Загрузка...</div>;

  const update = (patch: Partial<AdminPost>) =>
    setDraft((d) => (d ? { ...d, ...patch } : d));

  const dirty = JSON.stringify(post) !== JSON.stringify(draft);

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const updated = await adminUpdatePost(id, {
        slug: draft.slug,
        title_ru: draft.title_ru,
        title_kg: draft.title_kg ?? undefined,
        title_en: draft.title_en ?? undefined,
        excerpt_ru: draft.excerpt_ru ?? undefined,
        excerpt_kg: draft.excerpt_kg ?? undefined,
        excerpt_en: draft.excerpt_en ?? undefined,
        content_ru: draft.content_ru,
        content_kg: draft.content_kg ?? undefined,
        content_en: draft.content_en ?? undefined,
        cover_url: draft.cover_url ?? undefined,
        category_id: draft.category_id ?? undefined,
        author_id: draft.author_id ?? undefined,
        tags: draft.tags,
        is_featured: draft.is_featured,
        is_pinned: draft.is_pinned,
        seo_title: draft.seo_title ?? undefined,
        seo_description: draft.seo_description ?? undefined,
        seo_og_image: draft.seo_og_image ?? undefined,
      });
      setPost(updated);
      setDraft(updated);
      setMsg('Сохранено');
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    setBusy(true);
    try {
      await save();
      const updated = await adminPublishPost(id);
      setPost(updated);
      setDraft(updated);
      setMsg('Опубликовано');
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : 'Ошибка публикации');
    } finally {
      setBusy(false);
    }
  };

  const unpublish = async () => {
    setBusy(true);
    try {
      const updated = await adminUnpublishPost(id);
      setPost(updated);
      setDraft(updated);
      setMsg('Снято с публикации');
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  const uploadCover = async (file: File) => {
    setCoverUploading(true);
    try {
      const item = await adminUploadMedia(file);
      update({ cover_url: item.url });
    } finally {
      setCoverUploading(false);
    }
  };

  return (
    <div className={styles.editor}>
      <header className={styles.editorHeader}>
        <div className={styles.headerLeft}>
          <Link href="/admin/posts" className={styles.back}>
            <ArrowLeft size={14} /> К списку
          </Link>
          <div>
            <h1 className={styles.title}>{draft.title_ru || 'Новая статья'}</h1>
            <span className={styles.statusLine}>
              {post.status === 'published' ? '✓ Опубликовано' : '○ Черновик'}
              {dirty && ' · Несохранённые изменения'}
              {msg && ` · ${msg}`}
            </span>
          </div>
        </div>
        <div className={styles.headerActions}>
          <a
            href={`/blog/${draft.slug}`}
            target="_blank"
            rel="noreferrer"
            className={styles.previewBtn}
          >
            <ExternalLink size={14} /> Превью
          </a>
          <Button variant="secondary" size="md" onClick={save} loading={busy}>
            Сохранить
          </Button>
          {post.status === 'published' ? (
            <Button variant="ghost" size="md" onClick={unpublish}>
              Снять с публикации
            </Button>
          ) : (
            <Button variant="primary" size="md" onClick={publish} loading={busy}>
              Опубликовать
            </Button>
          )}
        </div>
      </header>

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <div className={styles.tabs}>
            {(['general', 'seo', 'locales'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                className={cn(styles.tabBtn, tab === t && styles.tabActive)}
                onClick={() => setTab(t)}
              >
                {t === 'general' ? 'Основное' : t === 'seo' ? 'SEO' : 'Языки'}
              </button>
            ))}
          </div>

          {tab === 'general' && (
            <div className={styles.tabContent}>
              <Input
                label="URL (slug)"
                value={draft.slug}
                onChange={(e) => update({ slug: e.target.value })}
              />

              <div className={styles.field}>
                <label className={styles.label}>Категория</label>
                <select
                  value={draft.category_id ?? ''}
                  onChange={(e) => update({ category_id: e.target.value || null })}
                  className={styles.select}
                >
                  <option value="">— Не выбрана —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_ru}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Автор</label>
                <select
                  value={draft.author_id ?? ''}
                  onChange={(e) => update({ author_id: e.target.value || null })}
                  className={styles.select}
                >
                  <option value="">— Не выбран —</option>
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Обложка</label>
                {draft.cover_url ? (
                  <div className={styles.cover}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={assetUrl(draft.cover_url) ?? draft.cover_url} alt="" />
                    <button
                      type="button"
                      onClick={() => update({ cover_url: null })}
                      className={styles.coverRemove}
                    >
                      Удалить
                    </button>
                  </div>
                ) : (
                  <label className={styles.coverUpload}>
                    {coverUploading ? 'Загрузка...' : 'Выбрать файл'}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void uploadCover(f);
                      }}
                    />
                  </label>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Краткое описание</label>
                <Textarea
                  value={draft.excerpt_ru ?? ''}
                  onChange={(e) => update({ excerpt_ru: e.target.value })}
                  rows={3}
                  maxLength={300}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Теги (через запятую)</label>
                <Input
                  value={draft.tags.join(', ')}
                  onChange={(e) =>
                    update({
                      tags: e.target.value
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>

              <div className={styles.field}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={draft.is_featured}
                    onChange={(e) => update({ is_featured: e.target.checked })}
                  />
                  <span>Featured (на главной)</span>
                </label>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={draft.is_pinned}
                    onChange={(e) => update({ is_pinned: e.target.checked })}
                  />
                  <span>Закрепить вверху списка</span>
                </label>
              </div>
            </div>
          )}

          {tab === 'seo' && (
            <div className={styles.tabContent}>
              <Input
                label="SEO Title"
                value={draft.seo_title ?? ''}
                onChange={(e) => update({ seo_title: e.target.value })}
                hint={`${(draft.seo_title || draft.title_ru).length}/60 символов`}
              />
              <div className={styles.field}>
                <label className={styles.label}>SEO Description</label>
                <Textarea
                  value={draft.seo_description ?? ''}
                  onChange={(e) => update({ seo_description: e.target.value })}
                  rows={3}
                  maxLength={160}
                />
              </div>
              <Input
                label="OG Image URL"
                value={draft.seo_og_image ?? ''}
                onChange={(e) => update({ seo_og_image: e.target.value })}
              />
            </div>
          )}

          {tab === 'locales' && (
            <div className={styles.tabContent}>
              <Input
                label="Заголовок (KG)"
                value={draft.title_kg ?? ''}
                onChange={(e) => update({ title_kg: e.target.value })}
              />
              <Input
                label="Заголовок (EN)"
                value={draft.title_en ?? ''}
                onChange={(e) => update({ title_en: e.target.value })}
              />
              <p className={styles.localeHint}>
                Контент на других языках сейчас редактируется через JSON. Расширим интерфейс
                позже.
              </p>
            </div>
          )}
        </aside>

        <div className={styles.contentEditor}>
          <input
            type="text"
            value={draft.title_ru}
            onChange={(e) => update({ title_ru: e.target.value })}
            placeholder="Заголовок статьи..."
            className={styles.titleInput}
          />
          <PostEditor
            blocks={draft.content_ru}
            onChange={(blocks: Block[]) => update({ content_ru: blocks })}
          />
        </div>
      </div>
    </div>
  );
}
