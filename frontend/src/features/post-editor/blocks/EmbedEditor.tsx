import styles from './blocks.module.scss';

interface Props {
  data: { url?: string; html?: string };
  onChange: (data: Record<string, unknown>) => void;
}

export function EmbedEditor({ data, onChange }: Props) {
  return (
    <div>
      <div className={styles.field}>
        <span className={styles.label}>URL для встраивания</span>
        <input
          type="url"
          value={data.url ?? ''}
          onChange={(e) => onChange({ url: e.target.value })}
          className={styles.input}
          placeholder="https://twitter.com/..., https://codepen.io/..."
        />
      </div>
      <div className={styles.field}>
        <span className={styles.label}>HTML кода встраивания (опционально)</span>
        <textarea
          value={data.html ?? ''}
          onChange={(e) => onChange({ html: e.target.value })}
          className={styles.textarea}
          rows={4}
          placeholder="Если есть готовый embed-код"
        />
        <span className={styles.hint}>
          HTML будет санитизирован перед отображением. Без html — рендерится как ссылка.
        </span>
      </div>
    </div>
  );
}
