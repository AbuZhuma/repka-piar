import type { VideoProvider } from '@/entities/post';
import { assetUrl } from '@/shared/lib/format';

import styles from './blocks.module.scss';

interface Props {
  url: string;
  provider: VideoProvider;
  caption?: string;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

function extractVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

export function VideoBlock({ url, provider, caption }: Props) {
  let embedUrl: string | null = null;
  if (provider === 'youtube') {
    const id = extractYouTubeId(url);
    if (id) embedUrl = `https://www.youtube.com/embed/${id}?rel=0`;
  } else if (provider === 'vimeo') {
    const id = extractVimeoId(url);
    if (id) embedUrl = `https://player.vimeo.com/video/${id}`;
  } else {
    embedUrl = assetUrl(url) ?? url;
  }

  return (
    <figure className={styles.videoBlock}>
      <div className={styles.videoWrapper}>
        {provider === 'self' ? (
          <video src={embedUrl ?? url} controls preload="metadata" />
        ) : embedUrl ? (
          <iframe
            src={embedUrl}
            title={caption ?? 'Video'}
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        ) : null}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
