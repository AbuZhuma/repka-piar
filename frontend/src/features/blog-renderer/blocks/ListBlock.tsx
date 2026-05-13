import { sanitizeHtml } from '@/shared/lib/sanitize';
import { cn } from '@/shared/lib/cn';

import styles from './blocks.module.scss';

interface Props {
  style: 'bullet' | 'number';
  items: string[];
}

export function ListBlock({ style, items }: Props) {
  const className = cn(styles.list, style === 'bullet' ? styles.bullet : styles.number);
  if (style === 'bullet') {
    return (
      <ul className={className}>
        {items.map((item, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: sanitizeHtml(item) }} />
        ))}
      </ul>
    );
  }
  return (
    <ol className={className}>
      {items.map((item, i) => (
        <li key={i} dangerouslySetInnerHTML={{ __html: sanitizeHtml(item) }} />
      ))}
    </ol>
  );
}
