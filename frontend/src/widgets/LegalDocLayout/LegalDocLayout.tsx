import type { ReactNode } from 'react';

import { ROUTES } from '@/shared/config/routes';
import { Container } from '@/shared/ui/Container';
import { Breadcrumbs } from '@/widgets/Breadcrumbs';

import styles from './LegalDocLayout.module.scss';

interface Props {
  title: string;
  lastUpdated: string;
  toc?: Array<{ id: string; label: string }>;
  children: ReactNode;
}

export function LegalDocLayout({ title, lastUpdated, toc, children }: Props) {
  return (
    <section className={styles.wrap}>
      <Container>
        <div className={styles.inner}>
          <Breadcrumbs
            items={[
              { label: 'Главная', href: ROUTES.home },
              { label: 'Юридические документы', href: ROUTES.contacts },
              { label: title },
            ]}
          />

          <header className={styles.header}>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.date}>Действует с {lastUpdated}</p>
          </header>

          <div className={styles.body}>
            {toc && toc.length > 0 && (
              <aside className={styles.toc}>
                <h3 className={styles.tocTitle}>Содержание</h3>
                <ul className={styles.tocList}>
                  {toc.map((item) => (
                    <li key={item.id}>
                      <a href={`#${item.id}`}>{item.label}</a>
                    </li>
                  ))}
                </ul>
              </aside>
            )}

            <article className={styles.content}>{children}</article>
          </div>

          <footer className={styles.legalFooter}>
            <p className={styles.legalNote}>
              Юридическая информация: Repka, Кыргызская Республика.
              <br />
              По всем вопросам пишите на <a href="mailto:legal@repka.kg">legal@repka.kg</a>.
            </p>
          </footer>
        </div>
      </Container>
    </section>
  );
}
