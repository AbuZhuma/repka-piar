import styles from './blocks.module.scss';

interface Props {
  data: { text?: string };
  onChange: (data: Record<string, unknown>) => void;
}

export function ParagraphEditor({ data, onChange }: Props) {
  return (
    <div>
      <div className={styles.field}>
        <textarea
          value={data.text ?? ''}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Текст параграфа..."
          className={styles.textarea}
          rows={4}
        />
        <span className={styles.formattingHint}>
          Можно использовать HTML: &lt;b&gt;, &lt;i&gt;, &lt;a href=&quot;...&quot;&gt;, &lt;u&gt;, &lt;mark&gt;
        </span>
      </div>
    </div>
  );
}
