'use client';

import { useState } from 'react';

import { adminUploadMedia } from '@/shared/api/admin';
import { assetUrl } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';

import styles from './blocks.module.scss';

interface Props {
  data: { url?: string; alt?: string; caption?: string; size?: string };
  onChange: (data: Record<string, unknown>) => void;
}

const SIZES = ['small', 'medium', 'large', 'full', 'wide'] as const;
const SIZE_LABELS: Record<string, string> = {
  small: 'Маленький',
  medium: 'Средний',
  large: 'Большой',
  full: 'Полный',
  wide: 'Во всю ширину',
};

export function ImageEditor({ data, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const item = await adminUploadMedia(file);
      onChange({ url: item.url });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить');
    } finally {
      setUploading(false);
    }
  };

  const previewUrl = data.url ? assetUrl(data.url) ?? data.url : null;

  return (
    <div>
      {previewUrl ? (
        <div className={styles.imagePreview}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt={data.alt ?? ''} />
          <div className={styles.imageActions}>
            <button
              type="button"
              className={styles.smallBtn}
              onClick={() => onChange({ url: '' })}
            >
              Заменить
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.uploader}>
          <p className={styles.hint}>
            {uploading ? 'Загрузка...' : 'Загрузите изображение (JPG, PNG, WebP, до 20 МБ)'}
          </p>
          <label className={styles.uploadBtn}>
            Выбрать файл
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFile(f);
              }}
              disabled={uploading}
            />
          </label>
          {error && <span style={{ color: 'var(--color-danger)' }}>{error}</span>}
        </div>
      )}

      {data.url && (
        <>
          <div className={styles.field}>
            <span className={styles.label}>Alt-текст</span>
            <input
              type="text"
              value={data.alt ?? ''}
              onChange={(e) => onChange({ alt: e.target.value })}
              placeholder="Описание для SEO и доступности"
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Подпись (опционально)</span>
            <input
              type="text"
              value={data.caption ?? ''}
              onChange={(e) => onChange({ caption: e.target.value })}
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Размер</span>
            <div className={styles.toggleGroup}>
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={cn(styles.toggleItem, (data.size ?? 'medium') === s && styles.toggleActive)}
                  onClick={() => onChange({ size: s })}
                >
                  {SIZE_LABELS[s]}
                </button>
              ))}
            </div>
            <span className={styles.hint}>
              Маленький: до 400px • Средний: по ширине контента • Большой: шире контента • Полный: ширина
              контейнера • Во всю ширину: на весь экран
            </span>
          </div>
        </>
      )}
    </div>
  );
}
