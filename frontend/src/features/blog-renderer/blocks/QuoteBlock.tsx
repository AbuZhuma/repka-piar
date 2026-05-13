import styles from './blocks.module.scss';

interface Props {
  text: string;
  author?: string;
}

export function QuoteBlock({ text, author }: Props) {
  return (
    <blockquote className={styles.quote}>
      <p>{text}</p>
      {author && <cite>— {author}</cite>}
    </blockquote>
  );
}
