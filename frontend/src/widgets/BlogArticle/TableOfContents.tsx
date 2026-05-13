'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/shared/lib/cn';
import type { Block } from '@/entities/post';

import styles from './BlogArticle.module.scss';

interface TocProps {
  content: Block[];
}

export function TableOfContents({ content }: TocProps) {
  const t = useTranslations('blog');
  const headings = content.filter(
    (b): b is Extract<Block, { type: 'heading' }> => b.type === 'heading',
  );
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-100px 0px -70% 0px' },
    );
    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 3) return null;

  return (
    <nav className={styles.toc} aria-label={t('toc')}>
      <h4 className={styles.tocTitle}>{t('toc')}</h4>
      <ul className={styles.tocList}>
        {headings.map((h) => (
          <li
            key={h.id}
            className={cn(
              styles.tocItem,
              activeId === h.id && styles.tocActive,
              h.data.level === 3 && styles.tocIndent,
              h.data.level === 4 && styles.tocIndent2,
            )}
          >
            <a href={`#${h.id}`}>{h.data.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
