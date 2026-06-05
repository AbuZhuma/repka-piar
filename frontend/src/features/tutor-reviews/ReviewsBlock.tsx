'use client';

import { Pencil, Star, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/features/auth';
import { Link } from '@/i18n/routing';
import {
  deleteMyReview,
  getReviews,
  upsertReview,
  type ReviewItem,
  type ReviewsResponse,
} from '@/shared/api/reviews';
import { ROUTES } from '@/shared/config/routes';
import { assetUrl } from '@/shared/lib/format';
import { Button } from '@/shared/ui/Button';
import { Textarea } from '@/shared/ui/Textarea';

import { StarRating } from './StarRating';
import styles from './ReviewsBlock.module.scss';

interface Props {
  slug: string;
  fullName: string;
}

export function ReviewsBlock({ slug, fullName }: Props) {
  const t = useTranslations('tutor_reviews');
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reload = useCallback(() => {
    setError(null);
    getReviews(slug)
      .then((r) => {
        setData(r);
        if (r.my_review) {
          setRating(r.my_review.rating);
          setText(r.my_review.text ?? '');
        } else {
          setRating(5);
          setText('');
        }
      })
      .catch((e: Error) => setError(e.message));
  }, [slug]);

  useEffect(() => {
    reload();
  }, [reload]);

  const myReview = data?.my_review ?? null;
  const canReview = isAuthenticated;

  const onSubmit = async () => {
    if (!canReview) return;
    setSubmitting(true);
    setError(null);
    try {
      await upsertReview(slug, rating, text.trim() || undefined);
      setEditing(false);
      reload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('save_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!confirm(t('confirm_delete'))) return;
    try {
      await deleteMyReview(slug);
      reload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('delete_failed'));
    }
  };

  if (!data) {
    return <section className={styles.section}>{error ?? t('loading')}</section>;
  }

  const avg = data.avg_rating ?? 0;
  const distMax = Math.max(1, ...data.distribution);

  return (
    <section className={styles.section} id="reviews">
      <header className={styles.head}>
        <h2 className={styles.title}>{t('title', { name: fullName })}</h2>
      </header>

      <div className={styles.summary}>
        <div className={styles.summaryNumber}>
          <span className={styles.avg}>{avg ? avg.toFixed(1) : '—'}</span>
          <StarRating value={Math.round(avg)} readOnly size={18} />
          <span className={styles.summaryCount}>
            {data.count > 0 ? t('count', { count: data.count }) : t('no_reviews')}
          </span>
        </div>
        {data.count > 0 && (
          <ul className={styles.histogram}>
            {[5, 4, 3, 2, 1].map((star) => {
              const c = data.distribution[star - 1];
              return (
                <li key={star} className={styles.histRow}>
                  <span className={styles.histLabel}>{star}</span>
                  <span className={styles.histTrack}>
                    <span
                      className={styles.histFill}
                      style={{ width: `${(c / distMax) * 100}%` }}
                    />
                  </span>
                  <span className={styles.histCount}>{c}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Review form */}
      {canReview && (editing || !myReview) && (
        <div className={styles.form}>
          <strong className={styles.formTitle}>
            {myReview ? t('edit_title') : t('leave_title')}
          </strong>
          <div className={styles.formRow}>
            <span className={styles.formLabel}>{t('your_rating')}</span>
            <StarRating value={rating} onChange={setRating} size={28} />
          </div>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            maxLength={4000}
            placeholder={t('text_placeholder')}
          />
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.formActions}>
            <Button variant="primary" size="md" onClick={onSubmit} loading={submitting}>
              {myReview ? t('save_edit') : t('publish')}
            </Button>
            {editing && (
              <Button variant="ghost" size="md" onClick={() => setEditing(false)}>
                {t('cancel')}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* My review preview (if exists and not editing) */}
      {canReview && myReview && !editing && (
        <div className={styles.myReview}>
          <header className={styles.myReviewHead}>
            <strong>{t('your_review_label')}</strong>
            <div className={styles.myReviewActions}>
              <button type="button" className={styles.iconBtn} onClick={() => setEditing(true)}>
                <Pencil size={14} /> {t('edit')}
              </button>
              <button type="button" className={styles.iconBtnDanger} onClick={onDelete}>
                <Trash2 size={14} /> {t('delete')}
              </button>
            </div>
          </header>
          <ReviewBody item={myReview} />
        </div>
      )}

      {/* Auth gate / own-profile note */}
      {!isAuthenticated && (
        <div className={styles.gate}>
          <Star size={18} />
          <p>
            {t('login_to_review')}{' '}
            <Link href={ROUTES.login} className={styles.gateLink}>
              {t('login')}
            </Link>{' '}
            {t('or')}{' '}
            <Link href={ROUTES.register} className={styles.gateLink}>
              {t('register')}
            </Link>
          </p>
        </div>
      )}
      {/* Other reviews */}
      {data.items.length > 0 && (
        <ul className={styles.list}>
          {data.items
            .filter((r) => !r.is_mine || !canReview)
            .map((r) => (
              <li key={r.id}>
                <ReviewBody item={r} />
              </li>
            ))}
        </ul>
      )}
    </section>
  );
}

function ReviewBody({ item }: { item: ReviewItem }) {
  const avatar = item.author.avatar_url
    ? assetUrl(item.author.avatar_url) ?? item.author.avatar_url
    : null;
  const date = new Date(item.created_at);
  const dateStr = date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const initials = item.author.name
    .split(/\s+/)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);

  return (
    <article className={styles.review}>
      <header className={styles.reviewHead}>
        <span className={styles.reviewAvatar}>
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" />
          ) : (
            <span>{initials}</span>
          )}
        </span>
        <div className={styles.reviewMeta}>
          <strong className={styles.reviewName}>{item.author.name || 'Аноним'}</strong>
          <span className={styles.reviewDate}>{dateStr}</span>
        </div>
        <StarRating value={item.rating} readOnly size={16} />
      </header>
      {item.text && <p className={styles.reviewText}>{item.text}</p>}
    </article>
  );
}
