'use client';

import { Filter } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';
import type { Subject } from '@/shared/types';

import { CatalogFiltersPanel } from './CatalogFiltersPanel';
import { MULTI_KEYS, useCatalogParams } from './useCatalogParams';

const SCALAR_KEYS = ['price_min', 'price_max', 'experience_min', 'is_native'];

interface MobileFiltersTriggerProps {
  subjects: Subject[];
}

export function MobileFiltersTrigger({ subjects }: MobileFiltersTriggerProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const { params, getMulti } = useCatalogParams();

  const multiCount = MULTI_KEYS.reduce((acc, key) => acc + getMulti(key).length, 0);
  const scalarCount = SCALAR_KEYS.reduce((acc, key) => (params[key] ? acc + 1 : acc), 0);
  const activeCount = multiCount + scalarCount;

  return (
    <>
      <Button
        variant="secondary"
        size="md"
        leftIcon={<Filter size={16} />}
        onClick={() => setOpen(true)}
      >
        {t('common.filters')}
        {activeCount > 0 && ` · ${activeCount}`}
      </Button>
      <Modal open={open} onOpenChange={setOpen} title={t('catalog.filters_title')} size="full">
        <CatalogFiltersPanel subjects={subjects} />
      </Modal>
    </>
  );
}
