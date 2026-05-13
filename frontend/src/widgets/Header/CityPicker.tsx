'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

import { getDictionaries } from '@/shared/api/dictionaries';
import { cn } from '@/shared/lib/cn';
import type { City } from '@/shared/types';

import styles from './CityPicker.module.scss';

const FALLBACK: City[] = [
  {
    id: 'bishkek',
    slug: 'bishkek',
    name_ru: 'Бишкек',
    timezone: 'Asia/Bishkek',
  } as City,
];

const STORAGE_KEY = 'repka_city_slug';

export function CityPicker() {
  const [cities, setCities] = useState<City[]>(FALLBACK);
  const [selectedSlug, setSelectedSlug] = useState<string>('bishkek');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setSelectedSlug(stored);
    let cancelled = false;
    getDictionaries()
      .then((d) => {
        if (!cancelled && d.cities.length > 0) setCities(d.cities);
      })
      .catch(() => {
        // keep fallback
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = cities.find((c) => c.slug === selectedSlug) ?? cities[0] ?? FALLBACK[0];

  const choose = (slug: string) => {
    setSelectedSlug(slug);
    try {
      localStorage.setItem(STORAGE_KEY, slug);
    } catch {
      // ignore
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className={styles.trigger}>
        <MapPin size={16} />
        <span>{selected.name_ru}</span>
        <ChevronDown size={14} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className={styles.content} sideOffset={6} align="start">
          {cities.map((city) => (
            <DropdownMenu.Item
              key={city.id}
              className={cn(styles.item, city.slug === selectedSlug && styles.itemSelected)}
              onSelect={() => choose(city.slug)}
            >
              <span>{city.name_ru}</span>
              {city.slug === selectedSlug && <Check size={14} />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
