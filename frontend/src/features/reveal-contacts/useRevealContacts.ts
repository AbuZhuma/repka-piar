'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { revealContacts, useRevealedContacts } from '@/entities/tutor';
import { ApiError } from '@/shared/lib/api';

export function useRevealContacts(slug: string) {
  const t = useTranslations('tutor_contacts');
  const setRevealed = useRevealedContacts((s) => s.setRevealed);
  const isRevealed = useRevealedContacts((s) => s.isRevealed(slug));
  const entry = useRevealedContacts((s) => s.getRevealed(slug));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reveal(captchaToken?: string) {
    setLoading(true);
    setError(null);
    try {
      const resp = await revealContacts(slug, captchaToken);
      setRevealed(slug, { contacts: resp, links: resp.links });
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) {
        setError(t('rate_limit_error'));
      } else {
        setError(t('generic_error'));
      }
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, isRevealed, entry, reveal };
}
