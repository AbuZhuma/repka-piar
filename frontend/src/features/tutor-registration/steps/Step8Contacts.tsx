'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { ApiError, apiPatch } from '@/shared/lib/api';
import { Checkbox } from '@/shared/ui/Checkbox';
import { Input } from '@/shared/ui/Input';

import { StepShell } from '../StepShell';
import { useRegistrationStore } from '../useRegistrationStore';

export function Step8Contacts() {
  const t = useTranslations('register.step8');
  const tErrors = useTranslations('auth.errors');
  const update = useRegistrationStore((s) => s.update);
  const next = useRegistrationStore((s) => s.next);
  const stored = useRegistrationStore((s) => ({
    contactPhone: s.contactPhone || s.phone,
    contactWhatsapp: s.contactWhatsapp,
    contactTelegram: s.contactTelegram,
    contactEmail: s.contactEmail || s.email,
    contactInstagram: s.contactInstagram,
  }));

  const [phone, setPhone] = useState(stored.contactPhone);
  const [whatsapp, setWhatsapp] = useState(stored.contactWhatsapp ?? '');
  const [whatsappSame, setWhatsappSame] = useState(false);
  const [telegram, setTelegram] = useState(stored.contactTelegram ?? '');
  const [instagram, setInstagram] = useState(stored.contactInstagram ?? '');
  const [email, setEmail] = useState(stored.contactEmail ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!phone.trim() && !whatsapp && !telegram) {
      setError('Укажите хотя бы один канал связи');
      return;
    }
    setLoading(true);
    setError(null);
    const wa = whatsappSame ? phone : whatsapp;
    try {
      await apiPatch('/api/tutors/me/contacts', {
        phone: phone || null,
        whatsapp: wa || null,
        telegram: telegram || null,
        email: email || null,
        instagram: instagram || null,
      });
      update({
        contactPhone: phone,
        contactWhatsapp: wa || undefined,
        contactTelegram: telegram || undefined,
        contactEmail: email || undefined,
        contactInstagram: instagram || undefined,
      });
      next();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : tErrors('generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepShell
      title={t('title')}
      subtitle={t('subtitle')}
      onNext={onSubmit}
      loading={loading}
      error={error}
    >
      <Input
        label={t('phone')}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+996 555 12 34 56"
      />
      <Input
        label={t('whatsapp')}
        value={whatsappSame ? phone : whatsapp}
        onChange={(e) => setWhatsapp(e.target.value)}
        disabled={whatsappSame}
        placeholder="+996 555 12 34 56"
      />
      <Checkbox
        label={t('whatsapp_same')}
        checked={whatsappSame}
        onCheckedChange={(v) => setWhatsappSame(v === true)}
      />
      <Input
        label={t('telegram')}
        value={telegram}
        onChange={(e) => setTelegram(e.target.value)}
        placeholder={t('telegram_placeholder')}
      />
      <Input
        label={t('instagram')}
        value={instagram}
        onChange={(e) => setInstagram(e.target.value)}
        placeholder="@username"
      />
      <Input
        label={t('email')}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
    </StepShell>
  );
}
