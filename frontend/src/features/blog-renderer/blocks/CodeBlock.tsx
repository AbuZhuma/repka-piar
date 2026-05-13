'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

import styles from './blocks.module.scss';

interface Props {
  language?: string;
  code: string;
}

export function CodeBlock({ language, code }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  return (
    <div className={styles.codeBlock}>
      <div className={styles.codeHeader}>
        <span className={styles.language}>{language ?? 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className={styles.copy}
          aria-label="Скопировать"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}
