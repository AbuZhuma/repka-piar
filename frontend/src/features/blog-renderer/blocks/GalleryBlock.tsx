'use client';

import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { assetUrl } from '@/shared/lib/format';

import styles from './blocks.module.scss';

interface Image {
  url: string;
  alt: string;
}

interface Props {
  images: Image[];
  layout: 'grid' | 'carousel';
}

export function GalleryBlock({ images, layout }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowLeft') setLightbox((i) => (i === null ? null : Math.max(0, i - 1)));
      if (e.key === 'ArrowRight')
        setLightbox((i) => (i === null ? null : Math.min(images.length - 1, i + 1)));
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightbox, images.length]);

  const renderItems = () =>
    images.map((img, i) => (
      <button key={i} type="button" onClick={() => setLightbox(i)} aria-label={img.alt}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={assetUrl(img.url) ?? img.url} alt={img.alt} loading="lazy" />
      </button>
    ));

  return (
    <>
      {layout === 'grid' ? (
        <div className={styles.galleryGrid}>{renderItems()}</div>
      ) : (
        <div className={styles.galleryCarousel}>
          {images.map((img, i) => (
            <div key={i} onClick={() => setLightbox(i)} role="button" tabIndex={0}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={assetUrl(img.url) ?? img.url} alt={img.alt} loading="lazy" />
            </div>
          ))}
        </div>
      )}

      {lightbox !== null && (
        <div className={styles.lightbox} onClick={() => setLightbox(null)}>
          <button
            type="button"
            className={styles.lightboxClose}
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(null);
            }}
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
          {lightbox > 0 && (
            <button
              type="button"
              className={`${styles.lightboxNav} ${styles.prev}`}
              onClick={(e) => {
                e.stopPropagation();
                setLightbox((i) => (i === null ? null : Math.max(0, i - 1)));
              }}
              aria-label="Предыдущее"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          {lightbox < images.length - 1 && (
            <button
              type="button"
              className={`${styles.lightboxNav} ${styles.next}`}
              onClick={(e) => {
                e.stopPropagation();
                setLightbox((i) =>
                  i === null ? null : Math.min(images.length - 1, i + 1),
                );
              }}
              aria-label="Следующее"
            >
              <ChevronRight size={24} />
            </button>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetUrl(images[lightbox].url) ?? images[lightbox].url}
            alt={images[lightbox].alt}
            className={styles.lightboxImage}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
