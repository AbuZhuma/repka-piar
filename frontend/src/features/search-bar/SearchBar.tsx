'use client';

import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useRouter } from '@/i18n/routing';
import { FORMATS, GOALS } from '@/shared/config/constants';
import { Button } from '@/shared/ui/Button';
import { Select } from '@/shared/ui/Select';
import type { Subject } from '@/shared/types';

import styles from './SearchBar.module.scss';

const ANY = '__any__';

export interface SearchBarProps {
  subjects: Subject[];
}

export function SearchBar({ subjects }: SearchBarProps) {
  const t = useTranslations();
  const router = useRouter();

  const [subject, setSubject] = useState<string>(ANY);
  const [goal, setGoal] = useState<string>(ANY);
  const [format, setFormat] = useState<string>(ANY);
  const [priceMax, setPriceMax] = useState<string>(ANY);

  const subjectOptions = [
    { value: ANY, label: t('common.any') },
    ...subjects.map((s) => ({ value: s.slug, label: s.name_ru })),
  ];
  const goalOptions = [
    { value: ANY, label: t('common.any') },
    ...GOALS.map((g) => ({ value: g, label: t(`goals.${g}`) })),
  ];
  const formatOptions = [
    { value: ANY, label: t('common.any') },
    ...FORMATS.map((f) => ({ value: f, label: t(`formats.${f}`) })),
  ];
  const priceOptions = [
    { value: ANY, label: t('common.any') },
    { value: '500', label: '500' },
    { value: '1000', label: '1000' },
    { value: '1500', label: '1500' },
    { value: '2000', label: '2000' },
    { value: '3000', label: '3000' },
    { value: '5000', label: '5000' },
  ];

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (subject !== ANY) params.set('subject', subject);
    if (goal !== ANY) params.set('goal', goal);
    if (format !== ANY) params.set('format', format);
    if (priceMax !== ANY) params.set('price_max', priceMax);
    const qs = params.toString();
    router.push(qs ? `/catalog?${qs}` : '/catalog');
  };

  return (
    <form className={styles.bar} onSubmit={onSubmit}>
      <div className={styles.field}>
        <label className={styles.label}>{t('homepage.search.subject_placeholder')}</label>
        <Select
          value={subject}
          onValueChange={setSubject}
          options={subjectOptions}
          placeholder={t('common.any')}
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>{t('homepage.search.goal_placeholder')}</label>
        <Select
          value={goal}
          onValueChange={setGoal}
          options={goalOptions}
          placeholder={t('common.any')}
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>{t('homepage.search.format_placeholder')}</label>
        <Select
          value={format}
          onValueChange={setFormat}
          options={formatOptions}
          placeholder={t('common.any')}
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>{t('homepage.search.price_placeholder')}</label>
        <Select
          value={priceMax}
          onValueChange={setPriceMax}
          options={priceOptions}
          placeholder={t('common.any')}
        />
      </div>
      <Button type="submit" size="lg" leftIcon={<Search size={18} />}>
        {t('homepage.search.search_button')}
      </Button>
    </form>
  );
}
