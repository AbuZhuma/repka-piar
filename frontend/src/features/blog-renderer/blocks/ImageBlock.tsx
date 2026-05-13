import { assetUrl } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';

import type { ImageSize } from '@/entities/post';

import styles from './blocks.module.scss';

interface Props {
  url: string;
  alt: string;
  caption?: string;
  size?: ImageSize;
}

export function ImageBlock({ url, alt, caption, size = 'medium' }: Props) {
  const src = assetUrl(url) ?? url;
  return (
    <figure className={cn(styles.imageBlock, styles[`size-${size}`])}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
