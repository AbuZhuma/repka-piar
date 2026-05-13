import { sanitizeHtml } from '@/shared/lib/sanitize';

import styles from './blocks.module.scss';

interface Props {
  url: string;
  html?: string;
}

export function EmbedBlock({ url, html }: Props) {
  if (html) {
    const safe = sanitizeHtml(html);
    return <div className={styles.embed} dangerouslySetInnerHTML={{ __html: safe }} />;
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={styles.embedLink}>
      {url}
    </a>
  );
}
