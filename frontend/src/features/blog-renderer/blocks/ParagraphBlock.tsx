import { sanitizeHtml } from '@/shared/lib/sanitize';

import styles from './blocks.module.scss';

interface Props {
  text: string;
}

export function ParagraphBlock({ text }: Props) {
  const html = sanitizeHtml(text);
  return <p className={styles.paragraph} dangerouslySetInnerHTML={{ __html: html }} />;
}
