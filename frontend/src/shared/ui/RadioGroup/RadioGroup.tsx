'use client';

import * as RxRadio from '@radix-ui/react-radio-group';
import { useId } from 'react';

import { cn } from '@/shared/lib/cn';

import styles from './RadioGroup.module.scss';

export interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: RadioOption[];
  name?: string;
  className?: string;
  layout?: 'row' | 'column';
}

export function RadioGroup({
  value,
  defaultValue,
  onValueChange,
  options,
  name,
  className,
  layout = 'row',
}: RadioGroupProps) {
  const reactId = useId();
  return (
    <RxRadio.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      name={name}
      className={cn(styles.group, styles[`layout_${layout}`], className)}
    >
      {options.map((opt) => {
        const id = `${reactId}-${opt.value}`;
        return (
          <label key={opt.value} htmlFor={id} className={styles.row}>
            <RxRadio.Item value={opt.value} id={id} className={styles.item}>
              <RxRadio.Indicator className={styles.indicator} />
            </RxRadio.Item>
            <span className={styles.label}>{opt.label}</span>
          </label>
        );
      })}
    </RxRadio.Root>
  );
}
