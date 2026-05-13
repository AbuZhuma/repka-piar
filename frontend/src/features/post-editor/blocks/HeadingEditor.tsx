import { cn } from '@/shared/lib/cn';

import styles from './blocks.module.scss';

interface Props {
  data: { level?: 2 | 3 | 4; text?: string };
  onChange: (data: Record<string, unknown>) => void;
}

export function HeadingEditor({ data, onChange }: Props) {
  return (
    <div>
      <div className={styles.field}>
        <span className={styles.label}>Уровень</span>
        <div className={styles.toggleGroup}>
          {[2, 3, 4].map((lvl) => (
            <button
              key={lvl}
              type="button"
              className={cn(styles.toggleItem, data.level === lvl && styles.toggleActive)}
              onClick={() => onChange({ level: lvl })}
            >
              H{lvl}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.field}>
        <input
          type="text"
          value={data.text ?? ''}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Заголовок..."
          className={cn(styles.input, styles.headingInput)}
        />
      </div>
    </div>
  );
}
