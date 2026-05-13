'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

import { useRevealedContacts } from '@/entities/tutor';
import type { TutorFull } from '@/entities/tutor/model/types';
import { ContactsList, RevealContactsButton } from '@/features/reveal-contacts';
import { formatPrice } from '@/shared/lib/format';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';

import styles from './MobileContactBar.module.scss';

interface MobileContactBarProps {
  tutor: TutorFull;
}

export function MobileContactBar({ tutor }: MobileContactBarProps) {
  const t = useTranslations('tutor_contacts');
  const tCard = useTranslations('tutor_card');
  const tProfile = useTranslations('tutor_profile');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const entry = useRevealedContacts((s) => s.getRevealed(tutor.slug));

  return (
    <>
      <div className={styles.bar}>
        <div className={styles.priceMini}>
          {tutor.price.per_60 != null && (
            <span className={styles.priceValue}>
              {tCard('price_from', {
                price: formatPrice(tutor.price.per_60, tutor.price.currency, locale),
              })}
            </span>
          )}
          {tutor.price.trial_enabled && (
            <span className={styles.trial}>{tProfile('free_trial_short')}</span>
          )}
        </div>
        <Button size="md" onClick={() => setOpen(true)}>
          {t('mobile_cta')}
        </Button>
      </div>

      <Modal open={open} onOpenChange={setOpen} title={t('modal_title')} size="sm">
        {entry ? (
          <ContactsList slug={tutor.slug} contacts={entry.contacts} links={entry.links} />
        ) : (
          <RevealContactsButton slug={tutor.slug} contactsMasked={tutor.contacts_masked} />
        )}
      </Modal>
    </>
  );
}
