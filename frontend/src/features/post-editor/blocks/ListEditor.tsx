import { Plus, X } from 'lucide-react';

import { cn } from '@/shared/lib/cn';

import styles from './blocks.module.scss';

interface Props {
  data: { style?: 'bullet' | 'number'; items?: string[] };
  onChange: (data: Record<string, unknown>) => void;
}

export function ListEditor({ data, onChange }: Props) {
  const items = data.items ?? [];
  const style = data.style ?? 'bullet';

  const updateItem = (i: number, v: string) => {
    const next = [...items];
    next[i] = v;
    onChange({ items: next });
  };

  const addItem = () => onChange({ items: [...items, ''] });
  const removeItem = (i: number) =>
    onChange({ items: items.filter((_, idx) => idx !== i) });

  return (
    <div>
      <div className={styles.field}>
        <span className={styles.label}>Тип списка</span>
        <div className={styles.toggleGroup}>
          <button
            type="button"
            className={cn(styles.toggleItem, style === 'bullet' && styles.toggleActive)}
            onClick={() => onChange({ style: 'bullet' })}
          >
            • Маркеры
          </button>
          <button
            type="button"
            className={cn(styles.toggleItem, style === 'number' && styles.toggleActive)}
            onClick={() => onChange({ style: 'number' })}
          >
            1. Нумерация
          </button>
        </div>
      </div>

      {items.map((it, i) => (
        <div key={i} className={styles.row}>
          <span className={styles.bullet}>{style === 'bullet' ? '•' : `${i + 1}.`}</span>
          <input
            type="text"
            value={it}
            onChange={(e) => updateItem(i, e.target.value)}
            className={styles.input}
            placeholder={`Элемент ${i + 1}...`}
          />
          <button type="button" onClick={() => removeItem(i)} aria-label="Удалить">
            <X size={14} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className={styles.uploadBtn}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px' }}
      >
        <Plus size={14} /> Добавить пункт
      </button>
    </div>
  );
}
