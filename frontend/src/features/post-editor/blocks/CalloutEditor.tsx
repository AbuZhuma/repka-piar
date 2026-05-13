import { cn } from '@/shared/lib/cn';

import styles from './blocks.module.scss';

interface Props {
  data: { variant?: 'info' | 'tip' | 'warning' | 'success'; title?: string; text?: string };
  onChange: (data: Record<string, unknown>) => void;
}

const VARIANTS = ['info', 'tip', 'warning', 'success'] as const;
const LABELS: Record<string, string> = {
  info: 'Информация',
  tip: 'Совет',
  warning: 'Внимание',
  success: 'Готово',
};

export function CalloutEditor({ data, onChange }: Props) {
  const variant = data.variant ?? 'info';
  const wrapperClass = {
    info: styles.calloutInfo,
    tip: styles.calloutTip,
    warning: styles.calloutWarning,
    success: styles.calloutSuccess,
  }[variant];

  return (
    <div className={wrapperClass}>
      <div className={styles.field}>
        <span className={styles.label}>Тип</span>
        <div className={styles.toggleGroup}>
          {VARIANTS.map((v) => (
            <button
              key={v}
              type="button"
              className={cn(styles.toggleItem, variant === v && styles.toggleActive)}
              onClick={() => onChange({ variant: v })}
            >
              {LABELS[v]}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Заголовок (опционально)</span>
        <input
          type="text"
          value={data.title ?? ''}
          onChange={(e) => onChange({ title: e.target.value })}
          className={styles.input}
        />
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Текст</span>
        <textarea
          value={data.text ?? ''}
          onChange={(e) => onChange({ text: e.target.value })}
          className={styles.textarea}
          rows={3}
        />
      </div>
    </div>
  );
}
