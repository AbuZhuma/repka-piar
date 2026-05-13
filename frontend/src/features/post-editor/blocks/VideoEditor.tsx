import { cn } from '@/shared/lib/cn';

import styles from './blocks.module.scss';

interface Props {
  data: { url?: string; provider?: string; caption?: string };
  onChange: (data: Record<string, unknown>) => void;
}

function detect(url: string): 'youtube' | 'vimeo' | 'self' {
  if (/youtu\.?be/i.test(url)) return 'youtube';
  if (/vimeo/i.test(url)) return 'vimeo';
  return 'self';
}

export function VideoEditor({ data, onChange }: Props) {
  return (
    <div>
      <div className={styles.field}>
        <span className={styles.label}>URL видео</span>
        <input
          type="url"
          value={data.url ?? ''}
          onChange={(e) =>
            onChange({ url: e.target.value, provider: detect(e.target.value) })
          }
          placeholder="https://youtube.com/watch?v=... или https://vimeo.com/..."
          className={styles.input}
        />
        <span className={styles.hint}>
          YouTube, Vimeo или прямая ссылка на mp4/webm
        </span>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Провайдер</span>
        <div className={styles.toggleGroup}>
          {(['youtube', 'vimeo', 'self'] as const).map((p) => (
            <button
              key={p}
              type="button"
              className={cn(
                styles.toggleItem,
                (data.provider ?? 'youtube') === p && styles.toggleActive,
              )}
              onClick={() => onChange({ provider: p })}
            >
              {p === 'self' ? 'Свой файл' : p}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Подпись</span>
        <input
          type="text"
          value={data.caption ?? ''}
          onChange={(e) => onChange({ caption: e.target.value })}
          className={styles.input}
        />
      </div>
    </div>
  );
}
