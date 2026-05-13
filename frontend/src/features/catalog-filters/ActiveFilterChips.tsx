'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { Subject } from '@/shared/types';

import styles from './ActiveFilterChips.module.scss';
import { useCatalogParams } from './useCatalogParams';

interface ActiveFilterChipsProps {
  subjects: Subject[];
}

interface Chip {
  id: string;
  label: string;
  onRemove: () => void;
}

function tryTranslate(t: (k: string) => string, key: string, fallback: string): string {
  try {
    return t(key);
  } catch {
    return fallback;
  }
}

export function ActiveFilterChips({ subjects }: ActiveFilterChipsProps) {
  const t = useTranslations();
  const { get, getMulti, remove, removeFromMulti } = useCatalogParams();

  const chips: Chip[] = [];

  for (const slug of getMulti('subject')) {
    const subj = subjects.find((s) => s.slug === slug);
    chips.push({
      id: `subject:${slug}`,
      label: subj?.name_ru ?? slug,
      onRemove: () => removeFromMulti('subject', slug),
    });
  }
  for (const goal of getMulti('goal')) {
    chips.push({
      id: `goal:${goal}`,
      label: tryTranslate(t, `goals.${goal}`, goal),
      onRemove: () => removeFromMulti('goal', goal),
    });
  }
  for (const format of getMulti('format')) {
    chips.push({
      id: `format:${format}`,
      label: tryTranslate(t, `formats.${format}`, format),
      onRemove: () => removeFromMulti('format', format),
    });
  }
  for (const ag of getMulti('age_group')) {
    chips.push({
      id: `age_group:${ag}`,
      label: tryTranslate(t, `age_groups.${ag}`, ag),
      onRemove: () => removeFromMulti('age_group', ag),
    });
  }
  for (const lng of getMulti('language')) {
    chips.push({
      id: `language:${lng}`,
      label: tryTranslate(t, `languages.${lng}`, lng),
      onRemove: () => removeFromMulti('language', lng),
    });
  }

  const priceMin = get('price_min');
  if (priceMin) {
    chips.push({
      id: 'price_min',
      label: `${t('common.from')} ${priceMin} сом`,
      onRemove: () => remove('price_min'),
    });
  }
  const priceMax = get('price_max');
  if (priceMax) {
    chips.push({
      id: 'price_max',
      label: `${t('common.to')} ${priceMax} сом`,
      onRemove: () => remove('price_max'),
    });
  }
  const expMin = get('experience_min');
  if (expMin) {
    chips.push({
      id: 'experience_min',
      label: `${expMin}+ лет`,
      onRemove: () => remove('experience_min'),
    });
  }
  if (get('is_native') === 'true') {
    chips.push({
      id: 'is_native',
      label: t('catalog.filter_groups.is_native'),
      onRemove: () => remove('is_native'),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className={styles.row}>
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          className={styles.chip}
          onClick={chip.onRemove}
          aria-label={`Remove ${chip.label}`}
        >
          <span>{chip.label}</span>
          <X size={14} />
        </button>
      ))}
    </div>
  );
}
