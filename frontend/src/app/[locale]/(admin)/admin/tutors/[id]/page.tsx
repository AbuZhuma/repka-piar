'use client';

import { ArrowLeft, Check, RotateCcw, Trash2, X } from 'lucide-react';
import { use, useEffect, useState } from 'react';

import {
  adminApproveTutor,
  adminBlockTutor,
  adminDeleteTutor,
  adminGetTutor,
  adminRejectTutor,
  adminRequestTutorChanges,
  adminUnblockTutor,
  type AdminTutorFull,
} from '@/shared/api/admin';
import { Link, useRouter } from '@/i18n/routing';
import { ROUTES } from '@/shared/config/routes';
import { Button } from '@/shared/ui/Button';
import { Textarea } from '@/shared/ui/Textarea';
import { assetUrl } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';

import styles from './page.module.scss';

const STATUS_LABEL: Record<string, string> = {
  active: 'Активен',
  pending: 'На проверке',
  pending_review: 'На проверке',
  rejected: 'Отклонён',
  inactive: 'Заблокирован',
};

interface Props {
  params: Promise<{ id: string }>;
}

export default function AdminTutorPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<AdminTutorFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const reload = () => {
    setLoading(true);
    adminGetTutor(id)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const action = async (fn: () => Promise<unknown>, label: string) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      setMsg(`${label} ✓`);
      reload();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className={styles.loading}>Загрузка...</div>;
  if (!data) return <div className={styles.loading}>Не найдено</div>;

  const profile = data.profile as Record<string, unknown> & {
    id: string;
    slug: string;
    status: string;
    bio?: string;
    short_bio?: string;
    photo_url?: string;
    video_url?: string;
    experience_years?: number;
    price_per_60?: number;
    price_per_90?: number;
    trial_enabled?: boolean;
    contact_phone?: string;
    contact_email?: string;
    contact_telegram?: string;
    contact_whatsapp?: string;
  };
  const user = data.user as { name: string; surname: string; email: string; phone: string };
  const photo = assetUrl(profile.photo_url) ?? profile.photo_url ?? null;
  const status = profile.status;

  return (
    <div>
      <Link href={ROUTES.admin.tutors} className={styles.back}>
        <ArrowLeft size={14} /> К списку
      </Link>

      <div className={styles.layout}>
        <div className={styles.left}>
          <div className={styles.card}>
            <div className={styles.tutorHead}>
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="" className={styles.photo} />
              ) : (
                <div className={styles.photoFallback}>{(user.name[0] ?? '').toUpperCase()}</div>
              )}
              <div>
                <h1 className={styles.title}>
                  {user.name} {user.surname}
                </h1>
                <p className={styles.muted}>
                  {user.email} · {user.phone}
                </p>
                <span className={cn(styles.status, styles[`status-${status}`])}>
                  {STATUS_LABEL[status] ?? status}
                </span>
              </div>
            </div>
          </div>

          <Section title="О себе">
            <p className={styles.text}>{profile.bio || profile.short_bio || '—'}</p>
          </Section>

          <Section title="Цены и услуги">
            <Field label="60 минут" value={profile.price_per_60 ? `${profile.price_per_60} сом` : '—'} />
            <Field label="90 минут" value={profile.price_per_90 ? `${profile.price_per_90} сом` : '—'} />
            <Field label="Опыт" value={`${profile.experience_years ?? 0} лет`} />
            <Field label="Бесплатный пробный" value={profile.trial_enabled ? 'Да' : 'Нет'} />
          </Section>

          <Section title="Контакты">
            <Field label="Email" value={profile.contact_email || user.email} />
            <Field label="Телефон" value={profile.contact_phone || user.phone} />
            <Field label="Telegram" value={profile.contact_telegram || '—'} />
            <Field label="WhatsApp" value={profile.contact_whatsapp || '—'} />
          </Section>

          <Section title={`Предметы (${data.subjects.length})`}>
            {data.subjects.length === 0 ? (
              <p className={styles.muted}>—</p>
            ) : (
              <ul className={styles.list}>
                {data.subjects.map((s, i) => {
                  const sub = s as { name_ru?: string; slug?: string };
                  return <li key={i}>{sub.name_ru ?? sub.slug}</li>;
                })}
              </ul>
            )}
          </Section>

          <Section title={`Образование (${data.education.length})`}>
            {data.education.length === 0 ? (
              <p className={styles.muted}>—</p>
            ) : (
              <ul className={styles.list}>
                {data.education.map((e, i) => {
                  const ed = e as { institution?: string; specialty?: string; year_end?: number };
                  return (
                    <li key={i}>
                      <strong>{ed.institution}</strong>
                      {ed.specialty && <span> — {ed.specialty}</span>}
                      {ed.year_end && <span className={styles.muted}> ({ed.year_end})</span>}
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <Section title={`Опыт работы (${data.experience.length})`}>
            {data.experience.length === 0 ? (
              <p className={styles.muted}>—</p>
            ) : (
              <ul className={styles.list}>
                {data.experience.map((e, i) => {
                  const ex = e as { position?: string; company?: string; year_start?: number; year_end?: number };
                  return (
                    <li key={i}>
                      <strong>{ex.position}</strong>
                      {ex.company && <span> — {ex.company}</span>}
                      <span className={styles.muted}>
                        {' '}
                        ({ex.year_start ?? '?'}—{ex.year_end ?? 'наст.'})
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <Section title={`Документы (${data.documents.length})`}>
            {data.documents.length === 0 ? (
              <p className={styles.muted}>Не загружены</p>
            ) : (
              <div className={styles.docs}>
                {data.documents.map((d, i) => {
                  const doc = d as { url?: string; title?: string; mime_type?: string };
                  const url = doc.url ? assetUrl(doc.url) ?? doc.url : null;
                  return (
                    <a
                      key={i}
                      href={url ?? '#'}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.doc}
                    >
                      {doc.title || doc.url}
                    </a>
                  );
                })}
              </div>
            )}
          </Section>

          <Section title="Видео-визитка">
            {profile.video_url ? (
              <a href={assetUrl(profile.video_url) ?? profile.video_url} target="_blank" rel="noreferrer">
                Открыть видео
              </a>
            ) : (
              <p className={styles.muted}>Не загружена</p>
            )}
          </Section>

          <Section title="История модерации">
            {data.history.length === 0 ? (
              <p className={styles.muted}>Пока нет записей</p>
            ) : (
              <ul className={styles.history}>
                {data.history.map((h) => (
                  <li key={h.id}>
                    <strong>{h.action}</strong>
                    {h.reason && <p className={styles.muted}>Причина: {h.reason}</p>}
                    {h.notes && <p className={styles.muted}>Заметки: {h.notes}</p>}
                    <small>
                      {h.admin_name ?? 'admin'} · {new Date(h.created_at).toLocaleString('ru-RU')}
                    </small>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <aside className={styles.right}>
          <div className={styles.card}>
            <h3 className={styles.sectionTitle}>
              {status === 'active' ? 'Действия' : 'Решение по заявке'}
            </h3>

            {status !== 'active' && (
              <>
                <label className={styles.label}>Причина (для отклонения / правок)</label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Видна репетитору"
                />

                <label className={styles.label}>Внутренние заметки</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Не видно репетитору"
                />
              </>
            )}

            {msg && <p className={styles.msg}>{msg}</p>}

            <div className={styles.actions}>
              {status !== 'active' && (
                <>
                  <Button
                    variant="primary"
                    size="md"
                    disabled={busy}
                    onClick={() =>
                      action(() => adminApproveTutor(id, notes || undefined), 'Одобрено')
                    }
                  >
                    <Check size={14} /> Одобрить
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    disabled={busy || !reason.trim()}
                    onClick={() =>
                      action(
                        () => adminRequestTutorChanges(id, reason, notes || undefined),
                        'Запрошены изменения',
                      )
                    }
                  >
                    <RotateCcw size={14} /> Запросить правки
                  </Button>
                  <Button
                    variant="danger"
                    size="md"
                    disabled={busy || !reason.trim()}
                    onClick={() =>
                      action(() => adminRejectTutor(id, reason, notes || undefined), 'Отклонено')
                    }
                  >
                    <X size={14} /> Отклонить
                  </Button>
                </>
              )}

              {status === 'inactive' ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => action(() => adminUnblockTutor(id), 'Разблокировано')}
                >
                  Разблокировать
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => action(() => adminBlockTutor(id, reason || undefined), 'Заблокировано')}
                >
                  Заблокировать
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={async () => {
                  if (
                    !confirm(
                      `Удалить репетитора «${user.name} ${user.surname}»? Это безвозвратно — будут удалены анкета, документы, история модерации.`,
                    )
                  )
                    return;
                  setBusy(true);
                  try {
                    await adminDeleteTutor(id);
                    router.push(ROUTES.admin.tutors);
                  } catch (e: unknown) {
                    setMsg(e instanceof Error ? e.message : 'Не удалось удалить');
                    setBusy(false);
                  }
                }}
              >
                <Trash2 size={14} /> Удалить репетитора
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldValue}>{value}</span>
    </div>
  );
}
