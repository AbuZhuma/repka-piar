import type { CSSProperties } from 'react';

import { cn } from '@/shared/lib/cn';

import styles from './Skeleton.module.scss';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

export function Skeleton({ width, height, rounded = 'md', className }: SkeletonProps) {
  const style: CSSProperties = {};
  if (width !== undefined) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height !== undefined) style.height = typeof height === 'number' ? `${height}px` : height;
  return <span className={cn(styles.skeleton, styles[`r_${rounded}`], className)} style={style} />;
}
