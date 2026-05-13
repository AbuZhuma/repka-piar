import { useTranslations } from 'next-intl';

import {
  ActiveFilterChips,
  CatalogFiltersPanel,
  MobileFiltersTrigger,
  Pagination,
  SortTabs,
} from '@/features/catalog-filters';
import { TutorsGrid } from '@/widgets/TutorsGrid';
import { Container } from '@/shared/ui/Container';
import type { Subject } from '@/shared/types';
import type { TutorPublic, Pagination as PaginationData } from '@/entities/tutor/model/types';

import styles from './CatalogLayout.module.scss';

interface CatalogLayoutProps {
  tutors: TutorPublic[];
  pagination: PaginationData;
  subjects: Subject[];
  title: string;
}

export function CatalogLayout({ tutors, pagination, subjects, title }: CatalogLayoutProps) {
  const t = useTranslations();
  return (
    <section className={styles.section}>
      <Container className={styles.container}>
        <h1 className={styles.title}>{title}</h1>

        <div className={styles.layout}>
          <aside className={styles.aside}>
            <CatalogFiltersPanel subjects={subjects} />
          </aside>

          <div className={styles.main}>
            <div className={styles.toolbar}>
              <span className={styles.count}>
                {t('common.found_count', { count: pagination.total })}
              </span>
              <div className={styles.toolbarRight}>
                <div className={styles.mobileOnly}>
                  <MobileFiltersTrigger subjects={subjects} />
                </div>
                <SortTabs />
              </div>
            </div>

            <ActiveFilterChips subjects={subjects} />

            {tutors.length === 0 ? (
              <div className={styles.empty}>
                <h3 className={styles.emptyTitle}>{t('catalog.no_results_title')}</h3>
                <p className={styles.emptyText}>{t('common.try_reset')}</p>
              </div>
            ) : (
              <TutorsGrid tutors={tutors} withContainer={false} variant="catalog" />
            )}

            <Pagination page={pagination.page} totalPages={pagination.total_pages} />
          </div>
        </div>
      </Container>
    </section>
  );
}
