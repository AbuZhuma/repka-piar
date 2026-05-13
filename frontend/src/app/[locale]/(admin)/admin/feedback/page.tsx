'use client';

import { useEffect, useState } from 'react';

import {
  adminListFeedback,
  adminUpdateFeedback,
  type AdminFeedback,
  type Paginated,
} from '@/shared/api/admin';
import { Textarea } from '@/shared/ui/Textarea';
import { Button } from '@/shared/ui/Button';
import { cn } from '@/shared/lib/cn';

import styles from './page.module.scss';

const STATUSES = ['all', 'new', 'in_progress', 'closed'] as const;
const STATUS_LABEL: Record<string, string> = {
  all: 'Все',
  new: 'Новые',
  in_progress: 'В работе',
  closed: 'Закрытые',
};

export default function FeedbackPage() {
  const [data, setData] = useState<Paginated<AdminFeedback> | null>(null);
  const [status, setStatus] = useState<string>('all');
  const [selected, setSelected] = useState<AdminFeedback | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    setLoading(true);
    adminListFeedback({ status: status === 'all' ? undefined : status, limit: 100 })
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const onChangeStatus = async (id: string, newStatus: string) => {
    await adminUpdateFeedback(id, { status: newStatus });
    reload();
    if (selected?.id === id) setSelected({ ...selected, status: newStatus });
  };

  const saveNotes = async (id: string, notes: string) => {
    await adminUpdateFeedback(id, { notes });
    if (selected?.id === id) setSelected({ ...selected, notes });
  };

  return (
    <div>
      <h1 className={styles.title}>Обращения</h1>

      <div className={styles.tabs}>
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={cn(styles.tab, status === s && styles.tabActive)}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <div className={styles.layout}>
        <div className={styles.list}>
          {loading ? (
            <p className={styles.empty}>Загрузка...</p>
          ) : !data || data.data.length === 0 ? (
            <p className={styles.empty}>Обращений нет</p>
          ) : (
            data.data.map((f) => (
              <button
                key={f.id}
                type="button"
                className={cn(styles.item, selected?.id === f.id && styles.itemActive)}
                onClick={() => setSelected(f)}
              >
                <div className={styles.itemHead}>
                  <strong>{f.name || 'Аноним'}</strong>
                  <span className={cn(styles.statusBadge, styles[`status-${f.status}`])}>
                    {f.status}
                  </span>
                </div>
                <p className={styles.itemMsg}>{f.message.slice(0, 120)}</p>
                <span className={styles.itemDate}>
                  {new Date(f.created_at).toLocaleString('ru-RU')}
                </span>
              </button>
            ))
          )}
        </div>

        <aside className={styles.detail}>
          {selected ? (
            <FeedbackDetail
              key={selected.id}
              item={selected}
              onChangeStatus={(s) => onChangeStatus(selected.id, s)}
              onSaveNotes={(n) => saveNotes(selected.id, n)}
            />
          ) : (
            <p className={styles.empty}>Выберите обращение слева</p>
          )}
        </aside>
      </div>
    </div>
  );
}

function FeedbackDetail({
  item,
  onChangeStatus,
  onSaveNotes,
}: {
  item: AdminFeedback;
  onChangeStatus: (s: string) => Promise<void>;
  onSaveNotes: (n: string) => Promise<void>;
}) {
  const [notes, setNotes] = useState(item.notes ?? '');
  const [saving, setSaving] = useState(false);

  return (
    <div className={styles.detailBody}>
      <h3>{item.name || 'Аноним'}</h3>
      <p className={styles.contact}>{item.email ?? '—'} · {item.phone ?? '—'}</p>
      {item.topic && <p className={styles.topic}>Тема: {item.topic}</p>}
      <p className={styles.itemDate}>
        {new Date(item.created_at).toLocaleString('ru-RU')}
      </p>
      <div className={styles.message}>{item.message}</div>

      <div className={styles.statusBlock}>
        <label className={styles.label}>Статус</label>
        <div className={styles.statusBtns}>
          {(['new', 'in_progress', 'closed'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChangeStatus(s)}
              className={cn(
                styles.statusBtn,
                item.status === s && styles.statusBtnActive,
              )}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.statusBlock}>
        <label className={styles.label}>Внутренние заметки</label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
        <Button
          variant="primary"
          size="sm"
          loading={saving}
          onClick={async () => {
            setSaving(true);
            try {
              await onSaveNotes(notes);
            } finally {
              setSaving(false);
            }
          }}
          disabled={notes === (item.notes ?? '')}
        >
          Сохранить заметки
        </Button>
      </div>

      {item.email && (
        <a href={`mailto:${item.email}`} className={styles.replyBtn}>
          Ответить по email
        </a>
      )}
    </div>
  );
}
