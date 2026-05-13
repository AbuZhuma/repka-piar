import styles from './blocks.module.scss';

interface Props {
  data: { text?: string; author?: string };
  onChange: (data: Record<string, unknown>) => void;
}

export function QuoteEditor({ data, onChange }: Props) {
  return (
    <div>
      <div className={styles.field}>
        <span className={styles.label}>Цитата</span>
        <textarea
          value={data.text ?? ''}
          onChange={(e) => onChange({ text: e.target.value })}
          className={styles.textarea}
          rows={3}
          placeholder="Текст цитаты..."
        />
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Автор (опционально)</span>
        <input
          type="text"
          value={data.author ?? ''}
          onChange={(e) => onChange({ author: e.target.value })}
          className={styles.input}
        />
      </div>
    </div>
  );
}
