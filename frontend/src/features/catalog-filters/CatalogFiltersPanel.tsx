'use client';

import { useTranslations } from 'next-intl';

import { AGE_GROUPS, FORMATS, GOALS, TEACHING_LANGUAGES } from '@/shared/config/constants';
import { Button } from '@/shared/ui/Button';
import { Checkbox } from '@/shared/ui/Checkbox';
import { PriceRange } from '@/shared/ui/Slider';
import type { Subject } from '@/shared/types';

import styles from './CatalogFiltersPanel.module.scss';
import { useCatalogParams } from './useCatalogParams';

const PRICE_MIN = 200;
const PRICE_MAX = 5000;
const PRICE_STEP = 100;
const EXPERIENCE_OPTIONS = [0, 1, 3, 5, 10];

interface CatalogFiltersPanelProps {
  subjects: Subject[];
  className?: string;
}

export function CatalogFiltersPanel({ subjects, className }: CatalogFiltersPanelProps) {
  const t = useTranslations();
  const { get, getMulti, setOne, toggleMulti, reset } = useCatalogParams();

  const subjectsSelected = getMulti('subject');
  const goalsSelected = getMulti('goal');
  const formatsSelected = getMulti('format');
  const ageGroupsSelected = getMulti('age_group');
  const languagesSelected = getMulti('language');
  const isNative = get('is_native') === 'true';
  const priceMin = Number(get('price_min') ?? PRICE_MIN);
  const priceMax = Number(get('price_max') ?? PRICE_MAX);
  const experienceMin = Number(get('experience_min') ?? 0);

  return (
    <aside className={`${styles.panel} ${className ?? ''}`}>
      <header className={styles.head}>
        <h3 className={styles.title}>{t('catalog.filters_title')}</h3>
        <Button variant="ghost" size="sm" onClick={reset}>
          {t('common.reset_all')}
        </Button>
      </header>

      <FilterGroup label={t('catalog.filter_groups.subject')}>
        {subjects.map((s) => (
          <Checkbox
            key={s.id}
            label={s.name_ru}
            checked={subjectsSelected.includes(s.slug)}
            onCheckedChange={() => toggleMulti('subject', s.slug)}
          />
        ))}
      </FilterGroup>

      <FilterGroup label={t('catalog.filter_groups.goal')}>
        {GOALS.map((g) => (
          <Checkbox
            key={g}
            label={t(`goals.${g}`)}
            checked={goalsSelected.includes(g)}
            onCheckedChange={() => toggleMulti('goal', g)}
          />
        ))}
      </FilterGroup>

      <FilterGroup label={t('catalog.filter_groups.format')}>
        {FORMATS.map((f) => (
          <Checkbox
            key={f}
            label={t(`formats.${f}`)}
            checked={formatsSelected.includes(f)}
            onCheckedChange={() => toggleMulti('format', f)}
          />
        ))}
      </FilterGroup>

      <FilterGroup label={t('catalog.filter_groups.price')}>
        <PriceRange
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={[priceMin, priceMax]}
          onCommit={([lo, hi]) => {
            setOne('price_min', lo === PRICE_MIN ? undefined : lo);
            setTimeout(() => setOne('price_max', hi === PRICE_MAX ? undefined : hi), 0);
          }}
          formatValue={(n) => `${n} сом`}
        />
      </FilterGroup>

      <FilterGroup label={t('catalog.filter_groups.experience_min')}>
        {EXPERIENCE_OPTIONS.map((y) => (
          <Checkbox
            key={y}
            label={y === 0 ? t('common.any') : `${y}+ лет`}
            checked={experienceMin === y}
            onCheckedChange={(c) => setOne('experience_min', c && y > 0 ? y : undefined)}
          />
        ))}
      </FilterGroup>

      <FilterGroup label={t('catalog.filter_groups.age_group')}>
        {AGE_GROUPS.map((a) => (
          <Checkbox
            key={a}
            label={t(`age_groups.${a}`)}
            checked={ageGroupsSelected.includes(a)}
            onCheckedChange={() => toggleMulti('age_group', a)}
          />
        ))}
      </FilterGroup>

      <FilterGroup label={t('catalog.filter_groups.language')}>
        {TEACHING_LANGUAGES.map((lng) => (
          <Checkbox
            key={lng}
            label={t(`languages.${lng}`)}
            checked={languagesSelected.includes(lng)}
            onCheckedChange={() => toggleMulti('language', lng)}
          />
        ))}
      </FilterGroup>

      <FilterGroup label="">
        <Checkbox
          label={t('catalog.filter_groups.is_native')}
          checked={isNative}
          onCheckedChange={(c) => setOne('is_native', c ? true : undefined)}
        />
      </FilterGroup>
    </aside>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className={styles.group}>
      {label && <h4 className={styles.groupTitle}>{label}</h4>}
      <div className={styles.groupBody}>{children}</div>
    </section>
  );
}
