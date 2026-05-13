'use client';

import * as RxSlider from '@radix-ui/react-slider';
import { useEffect, useState } from 'react';

import styles from './PriceRange.module.scss';

interface PriceRangeProps {
  min: number;
  max: number;
  step?: number;
  value?: [number, number];
  onCommit?: (value: [number, number]) => void;
  formatValue?: (n: number) => string;
}

export function PriceRange({
  min,
  max,
  step = 100,
  value,
  onCommit,
  formatValue = (n) => String(n),
}: PriceRangeProps) {
  const [local, setLocal] = useState<[number, number]>(value ?? [min, max]);

  useEffect(() => {
    if (value) setLocal(value);
  }, [value]);

  return (
    <div className={styles.wrap}>
      <div className={styles.values}>
        <span>{formatValue(local[0])}</span>
        <span>{formatValue(local[1])}</span>
      </div>
      <RxSlider.Root
        className={styles.root}
        min={min}
        max={max}
        step={step}
        value={local}
        onValueChange={(v) => setLocal([v[0], v[1]] as [number, number])}
        onValueCommit={(v) => onCommit?.([v[0], v[1]] as [number, number])}
        minStepsBetweenThumbs={1}
      >
        <RxSlider.Track className={styles.track}>
          <RxSlider.Range className={styles.range} />
        </RxSlider.Track>
        <RxSlider.Thumb className={styles.thumb} aria-label="Min price" />
        <RxSlider.Thumb className={styles.thumb} aria-label="Max price" />
      </RxSlider.Root>
    </div>
  );
}
