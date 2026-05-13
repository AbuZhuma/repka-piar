'use client';

import { useSearchParams } from 'next/navigation';
import { useTransition, useCallback, useMemo } from 'react';

import { usePathname, useRouter } from '@/i18n/routing';

export type ParamValue = string | number | boolean | null | undefined;

export const MULTI_KEYS = ['subject', 'goal', 'format', 'age_group', 'language'] as const;
export type MultiKey = (typeof MULTI_KEYS)[number];

export function useCatalogParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const params = useMemo(() => {
    const obj: Record<string, string> = {};
    if (!searchParams) return obj;
    searchParams.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }, [searchParams]);

  const get = useCallback((key: string): string | undefined => params[key], [params]);

  const getMulti = useCallback(
    (key: string): string[] => {
      const v = params[key];
      if (!v) return [];
      return v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    },
    [params],
  );

  const setAll = useCallback(
    (next: Record<string, ParamValue>) => {
      const usp = new URLSearchParams();
      Object.entries(next).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '' || value === false) return;
        usp.set(key, String(value));
      });
      const qs = usp.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [pathname, router],
  );

  const setOne = useCallback(
    (key: string, value: ParamValue) => {
      const next: Record<string, ParamValue> = {};
      Object.entries(params).forEach(([k, v]) => {
        if (k === 'page') return;
        if (k === key) return;
        next[k] = v;
      });
      next[key] = value;
      setAll(next);
    },
    [params, setAll],
  );

  const toggleMulti = useCallback(
    (key: string, value: string) => {
      const current = (params[key] ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setOne(key, next.length > 0 ? next.join(',') : undefined);
    },
    [params, setOne],
  );

  const removeFromMulti = useCallback(
    (key: string, value: string) => {
      const current = (params[key] ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const next = current.filter((v) => v !== value);
      setOne(key, next.length > 0 ? next.join(',') : undefined);
    },
    [params, setOne],
  );

  const remove = useCallback(
    (key: string) => {
      setOne(key, undefined);
    },
    [setOne],
  );

  const reset = useCallback(() => {
    startTransition(() => {
      router.push(pathname);
    });
  }, [pathname, router]);

  const setPage = useCallback(
    (page: number) => {
      const next: Record<string, ParamValue> = {};
      Object.entries(params).forEach(([k, v]) => {
        if (k === 'page') return;
        next[k] = v;
      });
      next.page = page;
      setAll(next);
    },
    [params, setAll],
  );

  return {
    params,
    get,
    getMulti,
    setOne,
    setAll,
    toggleMulti,
    removeFromMulti,
    remove,
    reset,
    setPage,
    isPending,
  };
}
