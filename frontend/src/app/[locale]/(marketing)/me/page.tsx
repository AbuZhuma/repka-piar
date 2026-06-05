'use client';

import { Camera, Heart, LogOut, Mail, User as UserIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { ProtectedRoute, useAuth, useAuthStore } from '@/features/auth';
import { Link, useRouter } from '@/i18n/routing';
import { resendVerification, updateMe, uploadAvatar } from '@/shared/api/me';
import { ROUTES } from '@/shared/config/routes';
import { assetUrl } from '@/shared/lib/format';
import { Button } from '@/shared/ui/Button';
import { Container } from '@/shared/ui/Container';
import { Input } from '@/shared/ui/Input';

import styles from './page.module.scss';

export default function UserProfilePage() {
  return (
    <ProtectedRoute>
      <UserProfileInner />
    </ProtectedRoute>
  );
}

function UserProfileInner() {
  const t = useTranslations('cabinet_user');
  const tAuth = useTranslations('auth');
  const { user, logout } = useAuth();
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();

  const [name, setName] = useState(user?.name ?? '');
  const [surname, setSurname] = useState(user?.surname ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setSurname(user.surname ?? '');
      setPhone(user.phone ?? '');
    }
  }, [user]);

  if (!user) return null;

  const isTutor = user.roles.includes('tutor');
  const isAdmin = user.roles.includes('admin');

  const onSaveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      await updateMe({
        name: name.trim(),
        surname: surname.trim(),
        phone: phone.trim() || undefined,
      });
      setUser({ ...user, name: name.trim(), surname: surname.trim(), phone: phone.trim() });
      setProfileMsg(t('saved'));
    } catch (e: unknown) {
      setProfileMsg(e instanceof Error ? e.message : t('save_error'));
    } finally {
      setSavingProfile(false);
    }
  };

  const onPickAvatar = () => fileRef.current?.click();

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadAvatar(file);
      setUser({ ...user, avatar_url: url });
    } catch (e: unknown) {
      setProfileMsg(e instanceof Error ? e.message : t('save_error'));
    } finally {
      setUploading(false);
    }
  };

  const onResend = async () => {
    setResending(true);
    setResendMsg(null);
    try {
      const r = await resendVerification();
      setResendMsg(r.already_verified ? t('email_already_verified') : t('email_resent'));
    } catch {
      setResendMsg(t('email_resend_failed'));
    } finally {
      setResending(false);
    }
  };

  const onLogout = async () => {
    await logout();
    router.push(ROUTES.home);
  };

  const initials = `${(user.name?.[0] ?? '').toUpperCase()}${(user.surname?.[0] ?? '').toUpperCase()}` || '?';
  const avatarSrc = user.avatar_url ? assetUrl(user.avatar_url) ?? user.avatar_url : null;

  return (
    <section className={styles.page}>
      <Container>
        <header className={styles.head}>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.subtitle}>{t('subtitle')}</p>
        </header>

        {!user.email_verified && (
          <div className={styles.notice}>
            <div className={styles.noticeBody}>
              <Mail size={18} />
              <div>
                <strong>{t('email_unverified_title')}</strong>
                <span>{t('email_unverified_body', { email: user.email })}</span>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={onResend} loading={resending}>
              {t('email_resend')}
            </Button>
            {resendMsg && <p className={styles.noticeMsg}>{resendMsg}</p>}
          </div>
        )}

        <div className={styles.grid}>
          {/* Avatar */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>{t('photo')}</h2>
            <div className={styles.avatarRow}>
              <div className={styles.avatar}>
                {avatarSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarSrc} alt="" />
                ) : (
                  <span className={styles.initials}>{initials}</span>
                )}
              </div>
              <div className={styles.avatarActions}>
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<Camera size={16} />}
                  onClick={onPickAvatar}
                  loading={uploading}
                >
                  {avatarSrc ? t('photo_change') : t('photo_upload')}
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={onAvatarChange}
                  hidden
                />
                <p className={styles.hint}>{t('photo_hint')}</p>
              </div>
            </div>
          </section>

          {/* Personal */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>{t('personal')}</h2>
            <div className={styles.formGrid}>
              <Input
                label={tAuth('first_name')}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label={tAuth('last_name_optional')}
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
              />
              <Input
                label={tAuth('phone_optional')}
                type="tel"
                value={phone}
                placeholder="+996700000000"
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input label={tAuth('email')} value={user.email} disabled />
            </div>
            <div className={styles.cardActions}>
              <Button variant="primary" size="md" onClick={onSaveProfile} loading={savingProfile}>
                {t('save')}
              </Button>
              {profileMsg && <span className={styles.savedHint}>{profileMsg}</span>}
            </div>
          </section>

          {/* Quick links */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>{t('shortcuts')}</h2>
            <div className={styles.shortcuts}>
              <Link href={ROUTES.favorites} className={styles.shortcut}>
                <Heart size={18} />
                <div>
                  <strong>{t('favorites')}</strong>
                  <span>{t('favorites_hint')}</span>
                </div>
              </Link>
              {isTutor && (
                <Link href={ROUTES.cabinet} className={styles.shortcut}>
                  <UserIcon size={18} />
                  <div>
                    <strong>{t('tutor_cabinet')}</strong>
                    <span>{t('tutor_cabinet_hint')}</span>
                  </div>
                </Link>
              )}
              {isAdmin && (
                <Link href={ROUTES.admin.root} className={styles.shortcut}>
                  <UserIcon size={18} />
                  <div>
                    <strong>{t('admin_panel')}</strong>
                    <span>{t('admin_panel_hint')}</span>
                  </div>
                </Link>
              )}
              {!isTutor && (
                <Link href={ROUTES.becomeTutor} className={styles.shortcut}>
                  <UserIcon size={18} />
                  <div>
                    <strong>{t('become_tutor')}</strong>
                    <span>{t('become_tutor_hint')}</span>
                  </div>
                </Link>
              )}
            </div>
          </section>

          {/* Logout */}
          <section className={styles.cardDanger}>
            <button type="button" onClick={onLogout} className={styles.logoutBtn}>
              <LogOut size={16} /> {t('logout')}
            </button>
          </section>
        </div>
      </Container>
    </section>
  );
}
