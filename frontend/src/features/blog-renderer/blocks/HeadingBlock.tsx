import styles from './blocks.module.scss';

interface Props {
  id: string;
  level: 2 | 3 | 4;
  text: string;
}

export function HeadingBlock({ id, level, text }: Props) {
  if (level === 2) return <h2 id={id} className={styles.h2}>{text}</h2>;
  if (level === 3) return <h3 id={id} className={styles.h3}>{text}</h3>;
  return <h4 id={id} className={styles.h4}>{text}</h4>;
}
