import { cn } from '@/shared/lib/cn';

import styles from './blocks.module.scss';

interface Props {
  data: { language?: string; code?: string };
  onChange: (data: Record<string, unknown>) => void;
}

export function CodeEditor({ data, onChange }: Props) {
  return (
    <div>
      <div className={styles.field}>
        <span className={styles.label}>Язык</span>
        <input
          type="text"
          value={data.language ?? ''}
          onChange={(e) => onChange({ language: e.target.value })}
          className={styles.input}
          placeholder="javascript, python, sql..."
        />
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Код</span>
        <textarea
          value={data.code ?? ''}
          onChange={(e) => onChange({ code: e.target.value })}
          className={cn(styles.textarea, styles.codeArea)}
          rows={8}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
