'use client';

import * as RxCheckbox from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { forwardRef, useId } from 'react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import styles from './Checkbox.module.scss';

interface CheckboxProps extends RxCheckbox.CheckboxProps {
  label: ReactNode;
  count?: number;
}

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox(
  { label, count, className, id, ...rest },
  ref,
) {
  const reactId = useId();
  const inputId = id ?? reactId;
  return (
    <label htmlFor={inputId} className={cn(styles.row, className)}>
      <RxCheckbox.Root ref={ref} id={inputId} className={styles.box} {...rest}>
        <RxCheckbox.Indicator className={styles.indicator}>
          <Check size={14} strokeWidth={3} />
        </RxCheckbox.Indicator>
      </RxCheckbox.Root>
      <span className={styles.label}>{label}</span>
      {typeof count === 'number' && <span className={styles.count}>{count}</span>}
    </label>
  );
});
