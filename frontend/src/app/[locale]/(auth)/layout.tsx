import type { ReactNode } from 'react';

import { Link } from '@/i18n/routing';
import { ROUTES } from '@/shared/config/routes';
import { Container } from '@/shared/ui/Container';
import { Logo } from '@/shared/ui/Logo';

import styles from './layout.module.scss';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Container className={styles.headerInner}>
          <Link href={ROUTES.home} aria-label="Repka">
            <Logo size="md" />
          </Link>
        </Container>
      </header>
      <main className={styles.main}>
        <Container className={styles.main_inner}>{children}</Container>
      </main>
    </div>
  );
}
