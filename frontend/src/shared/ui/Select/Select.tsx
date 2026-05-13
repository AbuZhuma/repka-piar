'use client';

import * as RxSelect from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { forwardRef } from 'react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import styles from './Select.module.scss';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options: SelectOption[];
  disabled?: boolean;
  className?: string;
  triggerIcon?: ReactNode;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  { value, defaultValue, onValueChange, placeholder, options, disabled, className, triggerIcon },
  ref,
) {
  return (
    <RxSelect.Root value={value} defaultValue={defaultValue} onValueChange={onValueChange} disabled={disabled}>
      <RxSelect.Trigger ref={ref} className={cn(styles.trigger, className)}>
        {triggerIcon && <span className={styles.triggerIcon}>{triggerIcon}</span>}
        <RxSelect.Value placeholder={placeholder} />
        <RxSelect.Icon className={styles.icon}>
          <ChevronDown size={16} />
        </RxSelect.Icon>
      </RxSelect.Trigger>
      <RxSelect.Portal>
        <RxSelect.Content className={styles.content} position="popper" sideOffset={4}>
          <RxSelect.Viewport className={styles.viewport}>
            {options.map((opt) => (
              <RxSelect.Item key={opt.value} value={opt.value} className={styles.item}>
                <RxSelect.ItemText>{opt.label}</RxSelect.ItemText>
                <RxSelect.ItemIndicator className={styles.itemIndicator}>
                  <Check size={14} />
                </RxSelect.ItemIndicator>
              </RxSelect.Item>
            ))}
          </RxSelect.Viewport>
        </RxSelect.Content>
      </RxSelect.Portal>
    </RxSelect.Root>
  );
});
