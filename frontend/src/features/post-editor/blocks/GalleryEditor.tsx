'use client';

import { Plus, X } from 'lucide-react';
import { useState } from 'react';

import { adminUploadMedia } from '@/shared/api/admin';
import { assetUrl } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';

import styles from './blocks.module.scss';

interface Props {
  data: {
    images?: Array<{ url: string; alt: string }>;
    layout?: 'grid' | 'carousel';
  };
  onChange: (data: Record<string, unknown>) => void;
}

export function GalleryEditor({ data, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const images = data.images ?? [];
  const layout = data.layout ?? 'grid';

  const onFile = async (file: File) => {
    setUploading(true);
    try {
      const item = await adminUploadMedia(file);
      onChange({ images: [...images, { url: item.url, alt: '' }] });
    } catch {
      /* noop */
    } finally {
      setUploading(false);
    }
  };

  const removeAt = (i: number) =>
    onChange({ images: images.filter((_, idx) => idx !== i) });

  return (
    <div>
      <div className={styles.field}>
        <span className={styles.label}>Раскладка</span>
        <div className={styles.toggleGroup}>
          <button
            type="button"
            className={cn(styles.toggleItem, layout === 'grid' && styles.toggleActive)}
            onClick={() => onChange({ layout: 'grid' })}
          >
            Сетка
          </button>
          <button
            type="button"
            className={cn(styles.toggleItem, layout === 'carousel' && styles.toggleActive)}
            onClick={() => onChange({ layout: 'carousel' })}
          >
            Карусель
          </button>
        </div>
      </div>

      {images.length > 0 && (
        <div className={styles.galleryGrid}>
          {images.map((img, i) => (
            <div key={i} className={styles.galleryItem}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={assetUrl(img.url) ?? img.url} alt={img.alt} />
              <button
                type="button"
                className={styles.galleryRemove}
                onClick={() => removeAt(i)}
                aria-label="Удалить"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={styles.uploader}>
        <p className={styles.hint}>{uploading ? 'Загрузка...' : 'Добавить изображение'}</p>
        <label className={styles.uploadBtn}>
          <Plus size={14} style={{ display: 'inline', marginRight: 6 }} /> Выбрать
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
              e.target.value = '';
            }}
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  );
}
