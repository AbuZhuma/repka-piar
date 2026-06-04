import { useTranslations } from 'next-intl';

import { cn } from '@/shared/lib/cn';

import styles from '../DashboardOverview.module.scss';

interface Props {
  status: string;
  rejectionReason?: string | null;
}

export function VerificationBanner({ status, rejectionReason }: Props) {
  const t = useTranslations('cabinet.verification');
  if (status === 'active') return null;
  const isPending = status === 'pending' || status === 'pending_review';
  const isRejected = status === 'rejected';
  return (
    <div
      className={cn(
        styles.banner,
        isPending && styles.bannerPending,
        isRejected && styles.bannerError,
      )}
    >
      <strong>{t(isRejected ? 'rejected_title' : 'pending_title')}</strong>
      <p>
        {isRejected
          ? t('rejected_text', { reason: rejectionReason ?? '—' })
          : t('pending_text')}
      </p>
    </div>
  );
}
