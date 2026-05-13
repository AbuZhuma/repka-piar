'use client';

import { forwardRef, useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';

import { cn } from '@/shared/lib/cn';

import styles from './Textarea.module.scss';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  counter?: { value: number; max: number };
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, counter, className, id, ...rest },
  ref,
) {
  const reactId = useId();
  const inputId = id ?? reactId;
  return (
    <div className={cn(styles.field, error && styles.invalid, className)}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <textarea ref={ref} id={inputId} className={styles.textarea} {...rest} />
      <div className={styles.footer}>
        {error ? (
          <span className={styles.error}>{error}</span>
        ) : hint ? (
          <span className={styles.hint}>{hint}</span>
        ) : (
          <span />
        )}
        {counter && (
          <span className={styles.counter}>
            {counter.value} / {counter.max}
          </span>
        )}
      </div>
    </div>
  );
});
