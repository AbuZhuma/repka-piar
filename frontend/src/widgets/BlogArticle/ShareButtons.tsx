'use client';

import { Check, Link2, Send } from 'lucide-react';
import { useState } from 'react';

import styles from './BlogArticle.module.scss';

interface Props {
  url: string;
  title: string;
}

export function ShareButtons({ url, title }: Props) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  const tg = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
  const wa = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} ${url}`)}`;

  return (
    <div className={styles.share}>
      <span className={styles.shareLabel}>Поделиться:</span>
      <a href={tg} target="_blank" rel="noopener noreferrer" className={styles.shareBtn} aria-label="Telegram">
        <Send size={16} />
      </a>
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.shareBtn}
        aria-label="WhatsApp"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M17.6 6.32A7.85 7.85 0 0012 4a7.91 7.91 0 00-6.78 12.02L4 21l5.13-1.34A7.91 7.91 0 0019.91 12a7.86 7.86 0 00-2.31-5.68zM12 18.49a6.55 6.55 0 01-3.34-.91l-.24-.14-2.79.73.74-2.72-.16-.25a6.57 6.57 0 119.59 3.29zm3.6-4.92c-.2-.1-1.17-.58-1.35-.64-.18-.07-.31-.1-.45.1-.13.2-.51.64-.62.77-.12.13-.23.15-.43.05a5.43 5.43 0 01-1.6-.99 5.96 5.96 0 01-1.1-1.37c-.12-.2 0-.31.09-.41.09-.1.2-.23.3-.35.1-.12.13-.2.2-.33.06-.13.03-.25-.02-.35-.05-.1-.45-1.08-.62-1.48-.16-.39-.32-.34-.45-.34h-.39a.74.74 0 00-.54.25 2.27 2.27 0 00-.7 1.69 3.93 3.93 0 00.83 2.1 9.06 9.06 0 003.49 3.06c.49.21.87.34 1.17.43.49.16.94.13 1.29.08.39-.06 1.17-.48 1.34-.94.16-.46.16-.86.11-.94-.04-.08-.18-.13-.38-.23z"/>
        </svg>
      </a>
      <button type="button" onClick={onCopy} className={styles.shareBtn} aria-label="Скопировать ссылку">
        {copied ? <Check size={16} /> : <Link2 size={16} />}
      </button>
    </div>
  );
}
