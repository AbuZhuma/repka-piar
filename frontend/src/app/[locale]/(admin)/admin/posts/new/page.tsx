'use client';

import { useEffect, useState } from 'react';

import { adminCreatePost } from '@/shared/api/admin';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';

import styles from './page.module.scss';

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s-]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/[а-яё]/gi, (c) => {
      const map: Record<string, string> = {
        а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i',
        й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
        у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '',
        э: 'e', ю: 'yu', я: 'ya',
      };
      return map[c.toLowerCase()] ?? c;
    });
}

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!touched) setSlug(slugify(title));
  }, [title, touched]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !slug.trim()) {
      setError('Заполните заголовок и slug');
      return;
    }
    setBusy(true);
    try {
      const post = await adminCreatePost({
        title_ru: title.trim(),
        slug: slug.trim(),
      });
      router.push(`/admin/posts/${post.id}/edit`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Не удалось создать');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Новая статья</h1>
      <form onSubmit={onSubmit} className={styles.form}>
        <Input
          label="Заголовок"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <Input
          label="URL (slug)"
          value={slug}
          onChange={(e) => {
            setTouched(true);
            setSlug(e.target.value);
          }}
          hint="Будет /blog/<slug>"
        />
        {error && <p className={styles.error}>{error}</p>}
        <Button type="submit" variant="primary" size="md" loading={busy}>
          Создать черновик
        </Button>
      </form>
    </div>
  );
}
