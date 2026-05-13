'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/shared/ui/Button';

import styles from './Pagination.module.scss';
import { useCatalogParams } from './useCatalogParams';

interface PaginationProps {
  page: number;
  totalPages: number;
}

export function Pagination({ page, totalPages }: PaginationProps) {
  const t = useTranslations();
  const { setPage, isPending } = useCatalogParams();
  if (totalPages <= 1) return null;

  return (
    <div className={styles.wrap}>
      {page < totalPages && (
        <Button
          variant="secondary"
          size="md"
          loading={isPending}
          onClick={() => setPage(page + 1)}
        >
          {t('common.show_more')}
        </Button>
      )}
      <span className={styles.info}>
        {page} / {totalPages}
      </span>
    </div>
  );
}
