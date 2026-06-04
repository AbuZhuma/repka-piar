'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useEditor } from './model/EditorContext';
import { ApiError, apiPatch } from '@/shared/lib/api';
import { Input } from '@/shared/ui/Input';

import { SectionShell } from './SectionShell';

export function EditContactsSection() {
  const t = useTranslations('cabinet.profile_edit');
  const { profile, setProfile } = useEditor();

  const [phone, setPhone] = useState(profile.contacts?.phone ?? profile.contact_phone ?? '');
  const [whatsapp, setWhatsapp] = useState(
    profile.contacts?.whatsapp ?? profile.contact_whatsapp ?? '',
  );
  const [telegram, setTelegram] = useState(
    profile.contacts?.telegram ?? profile.contact_telegram ?? '',
  );
  const [instagram, setInstagram] = useState(
    profile.contacts?.instagram ?? profile.contact_instagram ?? '',
  );
  const [email, setEmail] = useState(profile.contacts?.email ?? profile.contact_email ?? '');

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      await apiPatch('/api/tutors/me/contacts', {
        phone: phone || null,
        whatsapp: whatsapp || null,
        telegram: telegram || null,
        instagram: instagram || null,
        email: email || null,
      });
      setProfile((prev) => ({
        ...prev,
        contact_phone: phone || null,
        contact_whatsapp: whatsapp || null,
        contact_telegram: telegram || null,
        contact_instagram: instagram || null,
        contact_email: email || null,
        contacts: {
          phone: phone || null,
          whatsapp: whatsapp || null,
          telegram: telegram || null,
          instagram: instagram || null,
          email: email || null,
        },
      }));
      setSaved(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('save_error'));
    } finally {
      setLoading(false);
    }
  };

  const dirty = () => setSaved(false);

  return (
    <SectionShell
      id="contacts"
      title={t('section_contacts')}
      onSave={onSave}
      loading={loading}
      saved={saved}
      error={error}
    >
      <Input
        label={t('phone')}
        value={phone}
        onChange={(e) => {
          setPhone(e.target.value);
          dirty();
        }}
        placeholder="+996 555 12 34 56"
      />
      <Input
        label={t('whatsapp')}
        value={whatsapp}
        onChange={(e) => {
          setWhatsapp(e.target.value);
          dirty();
        }}
        placeholder="+996 555 12 34 56"
      />
      <Input
        label={t('telegram')}
        value={telegram}
        onChange={(e) => {
          setTelegram(e.target.value);
          dirty();
        }}
        placeholder="@username"
      />
      <Input
        label={t('instagram')}
        value={instagram}
        onChange={(e) => {
          setInstagram(e.target.value);
          dirty();
        }}
        placeholder="@username"
      />
      <Input
        label={t('email')}
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          dirty();
        }}
      />
    </SectionShell>
  );
}
