'use client';

import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import styles from './ContactLink.module.scss';

export type ContactLinkVariant = 'primary' | 'whatsapp' | 'telegram' | 'email' | 'instagram';

interface ContactLinkProps {
  icon: ReactNode;
  label: string;
  value: string;
  variant: ContactLinkVariant;
  onClick: () => void;
}

export function ContactLink({ icon, label, value, variant, onClick }: ContactLinkProps) {
  return (
    <button
      type="button"
      className={cn(styles.link, styles[`variant_${variant}`])}
      onClick={onClick}
    >
      <span className={styles.icon} aria-hidden>
        {icon}
      </span>
      <span className={styles.body}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{value}</span>
      </span>
    </button>
  );
}
