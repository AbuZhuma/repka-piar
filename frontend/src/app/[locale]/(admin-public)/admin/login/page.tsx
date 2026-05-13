'use client';

import { Shield } from 'lucide-react';
import { useEffect, useState } from 'react';

import { loginUser, useAuthStore } from '@/features/auth';
import { useRouter } from '@/i18n/routing';
import { ApiError } from '@/shared/lib/api';
import { auth } from '@/shared/lib/auth';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';

import styles from './page.module.scss';

export default function AdminLoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [emailOrPhone, setEmailOrPhone] = useState('admin@repka.kg');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.style.background = '#0f172a';
    return () => {
      document.body.style.background = '';
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!emailOrPhone || !password) {
      setError('Заполните все поля');
      return;
    }
    setLoading(true);
    try {
      const resp = await loginUser({
        email_or_phone: emailOrPhone,
        password,
      });
      if (!resp.user.roles?.includes('admin')) {
        auth.clear();
        setError('Этот аккаунт не является администратором');
        return;
      }
      auth.setTokens(resp.access_token, resp.refresh_token);
      setUser(resp.user);
      router.push('/admin');
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setError('Неверный email или пароль');
      } else {
        setError('Не удалось войти. Попробуйте позже.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <form className={styles.card} onSubmit={onSubmit}>
        <div className={styles.brand}>
          <Shield size={28} />
          <span>Repka Admin</span>
        </div>
        <h1 className={styles.title}>Вход в админку</h1>
        <p className={styles.subtitle}>Только для администраторов платформы</p>

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={emailOrPhone}
          onChange={(e) => setEmailOrPhone(e.target.value)}
        />
        <Input
          label="Пароль"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className={styles.error}>{error}</p>}

        <Button type="submit" variant="primary" size="md" loading={loading}>
          Войти
        </Button>
      </form>
    </div>
  );
}
