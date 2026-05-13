import { AlertTriangle, CheckCircle, Info, Lightbulb } from 'lucide-react';

import { cn } from '@/shared/lib/cn';
import type { CalloutVariant } from '@/entities/post';

import styles from './blocks.module.scss';

interface Props {
  variant: CalloutVariant;
  title?: string;
  text: string;
}

const VARIANT_ICONS: Record<CalloutVariant, React.ReactNode> = {
  info: <Info size={20} />,
  tip: <Lightbulb size={20} />,
  warning: <AlertTriangle size={20} />,
  success: <CheckCircle size={20} />,
};

export function CalloutBlock({ variant, title, text }: Props) {
  return (
    <aside className={cn(styles.callout, styles[variant])}>
      <span className={styles.icon}>{VARIANT_ICONS[variant]}</span>
      <div className={styles.body}>
        {title && <h4>{title}</h4>}
        <p>{text}</p>
      </div>
    </aside>
  );
}
