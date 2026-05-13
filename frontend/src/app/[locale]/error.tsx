'use client';

import { useEffect } from 'react';

import { Link } from '@/i18n/routing';
import { Button } from '@/shared/ui/Button';
import { Container } from '@/shared/ui/Container';

import styles from './not-found.module.scss';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('App error:', error);
  }, [error]);

  return (
    <section className={styles.section}>
      <Container>
        <div className={styles.wrap}>
          <div className={styles.code}>500</div>
          <h1 className={styles.title}>Что-то пошло не так</h1>
          <p className={styles.text}>
            Мы уже разбираемся. Попробуйте обновить страницу — если ошибка повторится,
            напишите нам.
          </p>

          {error.digest && (
            <p className={styles.text} style={{ fontFamily: 'monospace', fontSize: 12 }}>
              Код ошибки: {error.digest}
            </p>
          )}

          <div className={styles.actions}>
            <Button variant="primary" size="md" onClick={reset}>
              Обновить
            </Button>
            <Link href="/" className={styles.btnSecondary}>
              На главную
            </Link>
            <Link href="/contacts" className={styles.btnGhost}>
              Связаться с поддержкой
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
