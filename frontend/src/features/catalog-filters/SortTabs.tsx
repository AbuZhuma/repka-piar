'use client';

import { useTranslations } from 'next-intl';

import { Select } from '@/shared/ui/Select';

import { useCatalogParams } from './useCatalogParams';

const SORTS = ['relevance', 'price_asc', 'price_desc', 'experience', 'new'] as const;

export function SortTabs() {
  const t = useTranslations('catalog.sort');
  const { get, setOne } = useCatalogParams();
  const current = (get('sort') as (typeof SORTS)[number]) ?? 'relevance';

  return (
    <Select
      value={current}
      onValueChange={(v) => setOne('sort', v === 'relevance' ? undefined : v)}
      options={SORTS.map((s) => ({ value: s, label: t(s) }))}
    />
  );
}
