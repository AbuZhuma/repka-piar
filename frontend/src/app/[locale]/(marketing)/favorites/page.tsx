'use client';

import { Heart, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import { FavoriteButton, useFavoritesStore } from '@/features/favorites';
import { Link } from '@/i18n/routing';
import { ROUTES } from '@/shared/config/routes';
import { assetUrl, formatPrice } from '@/shared/lib/format';
import { Container } from '@/shared/ui/Container';

import styles from './page.module.scss';

export default function FavoritesPage() {
  const items = useFavoritesStore((s) => s.items);
  const clear = useFavoritesStore((s) => s.clear);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <section className={styles.page}>
        <Container>
          <header className={styles.head}>
            <h1 className={styles.title}>Избранные репетиторы</h1>
          </header>
        </Container>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <Container>
        <header className={styles.head}>
          <h1 className={styles.title}>
            <Heart size={24} fill="currentColor" className={styles.titleIcon} />
            Избранные репетиторы
          </h1>
          <p className={styles.subtitle}>
            Сохраняются у вас в браузере. Регистрация не нужна — удалите cookies/историю, и
            список очистится.
          </p>
          {items.length > 0 && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => {
                if (confirm('Очистить весь список избранного?')) clear();
              }}
            >
              <Trash2 size={14} /> Очистить список ({items.length})
            </button>
          )}
        </header>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <Heart size={48} className={styles.emptyIcon} />
            <h2>Пока пусто</h2>
            <p>
              Откройте{' '}
              <Link href={ROUTES.catalog} className={styles.emptyLink}>
                каталог
              </Link>{' '}
              и нажмите ♡ на карточке репетитора — он появится здесь.
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {items.map((tutor) => {
              const photoSrc = tutor.photo_url
                ? assetUrl(tutor.photo_url) ?? tutor.photo_url
                : null;
              const fullName = `${tutor.name} ${tutor.surname}`.trim();
              return (
                <article key={tutor.id} className={styles.card}>
                  <div className={styles.cardFav}>
                    <FavoriteButton
                      size="sm"
                      tutor={{
                        id: tutor.id,
                        slug: tutor.slug,
                        name: tutor.name,
                        surname: tutor.surname,
                        photo_url: tutor.photo_url,
                        price_per_60: tutor.price_per_60,
                        currency: tutor.currency,
                        specializations: tutor.specializations,
                        rating: tutor.rating,
                        reviews_count: tutor.reviews_count,
                        trial_enabled: tutor.trial_enabled,
                      }}
                    />
                  </div>
                  <Link href={ROUTES.tutor(tutor.slug)} className={styles.cardLink}>
                    <div className={styles.cardPhoto}>
                      {photoSrc ? (
                        <Image
                          src={photoSrc}
                          alt={fullName}
                          width={280}
                          height={280}
                          unoptimized
                          className={styles.cardImg}
                        />
                      ) : (
                        <span className={styles.cardFallback}>
                          {(tutor.name[0] ?? '').toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className={styles.cardBody}>
                      <h3 className={styles.cardName}>{fullName}</h3>
                      {tutor.specializations.length > 0 && (
                        <p className={styles.cardSpec}>
                          {tutor.specializations.slice(0, 2).join(' · ')}
                        </p>
                      )}
                      <p className={styles.cardPrice}>
                        {tutor.price_per_60 != null
                          ? `от ${formatPrice(tutor.price_per_60, tutor.currency, 'ru')} / час`
                          : 'Цена не указана'}
                      </p>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </Container>
    </section>
  );
}
