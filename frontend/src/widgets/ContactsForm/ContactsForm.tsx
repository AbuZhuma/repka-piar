'use client';

import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

import { ROUTES } from '@/shared/config/routes';
import { apiPost, ApiError } from '@/shared/lib/api';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Textarea } from '@/shared/ui/Textarea';

import styles from './ContactsForm.module.scss';

const TOPICS = [
  { value: 'student', label: 'Я ученик / родитель' },
  { value: 'tutor', label: 'Я репетитор' },
  { value: 'complaint', label: 'Жалоба на репетитора' },
  { value: 'press', label: 'Пресса и медиа' },
  { value: 'other', label: 'Другое' },
] as const;

interface Props {
  /** Initial topic (e.g. when opened from cabinet support page) */
  defaultTopic?: string;
  /** Title shown above the form */
  title?: string;
  /** Pre-fill from the logged-in user */
  defaultName?: string;
  defaultEmail?: string;
  defaultPhone?: string;
}

export function ContactsForm({
  defaultTopic = 'student',
  title = 'Напишите нам',
  defaultName = '',
  defaultEmail = '',
  defaultPhone = '',
}: Props) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState(defaultPhone);
  const [topic, setTopic] = useState<string>(defaultTopic);
  const [message, setMessage] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError('Укажите имя');
    if (!email.trim() || !email.includes('@')) return setError('Укажите корректный email');
    if (message.trim().length < 10) return setError('Сообщение должно быть не короче 10 символов');
    if (!agree) return setError('Нужно согласие на обработку персональных данных');

    setLoading(true);
    try {
      await apiPost('/api/feedback', {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        topic,
        message: message.trim(),
      });
      setSubmitted(true);
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        setError(e.message || 'Не удалось отправить. Попробуйте позже.');
      } else {
        setError('Не удалось отправить. Попробуйте позже.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className={styles.success}>
        <CheckCircle2 size={48} className={styles.successIcon} />
        <h3 className={styles.successTitle}>Спасибо!</h3>
        <p className={styles.successText}>
          Мы получили ваше обращение и ответим в течение 24 часов на email <strong>{email}</strong>.
        </p>
        <Button
          variant="ghost"
          size="md"
          onClick={() => {
            setSubmitted(false);
            setMessage('');
          }}
        >
          Отправить ещё одно
        </Button>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.subtitle}>
        Ответим на email или телефон в течение 24 часов в рабочие дни.
      </p>

      <div className={styles.row}>
        <Input
          label="Имя"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className={styles.row}>
        <Input
          label="Телефон"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+996 555 ..."
          hint="Опционально"
        />
        <div className={styles.field}>
          <label className={styles.label} htmlFor="contact-topic">
            Тема
          </label>
          <select
            id="contact-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className={styles.select}
          >
            {TOPICS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="contact-message">
          Сообщение
        </label>
        <Textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          maxLength={4000}
          placeholder="Расскажите подробно — это поможет нам быстрее помочь"
        />
        <span className={styles.counter}>{message.length} / 4000</span>
      </div>

      <label className={styles.consent}>
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
        />
        <span>
          Согласен на обработку персональных данных согласно{' '}
          <a href={ROUTES.legal.privacy} target="_blank" rel="noopener noreferrer">
            Политике конфиденциальности
          </a>
        </span>
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <Button type="submit" variant="primary" size="md" loading={loading}>
        Отправить
      </Button>
    </form>
  );
}
