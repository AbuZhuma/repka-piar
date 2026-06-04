import { Link } from '@/i18n/routing';
import { ROUTES } from '@/shared/config/routes';
import { Container } from '@/shared/ui/Container';

import styles from './not-found.module.scss';

export default function NotFound() {
  return (
    <section className={styles.section}>
      <Container>
        <div className={styles.wrap}>
          <div className={styles.code}>404</div>
          <h1 className={styles.title}>Страница не найдена</h1>
          <p className={styles.text}>
            Возможно, вы перешли по устаревшей ссылке или страница была удалена.
            Попробуйте начать поиск с главной.
          </p>

          <div className={styles.actions}>
            <Link href={ROUTES.home} className={styles.btnPrimary}>
              На главную
            </Link>
            <Link href={ROUTES.catalog} className={styles.btnSecondary}>
              Найти репетитора
            </Link>
            <Link href={ROUTES.contacts} className={styles.btnGhost}>
              Связаться с поддержкой
            </Link>
          </div>

          <div className={styles.popular}>
            <h3 className={styles.popularTitle}>Популярные разделы</h3>
            <ul className={styles.popularList}>
              <li>
                <Link href={ROUTES.catalog}>Каталог репетиторов</Link>
              </li>
              <li>
                <Link href={ROUTES.catalogBy({ goal: 'exam_ort' })}>Подготовка к ОРТ</Link>
              </li>
              <li>
                <Link href={ROUTES.catalogBy({ subject: 'english' })}>Английский язык</Link>
              </li>
              <li>
                <Link href={ROUTES.blog}>Блог</Link>
              </li>
              <li>
                <Link href={ROUTES.forStudents}>Ученикам и родителям</Link>
              </li>
              <li>
                <Link href={ROUTES.forTutors}>Репетиторам</Link>
              </li>
              <li>
                <Link href={ROUTES.support}>Поддержка и FAQ</Link>
              </li>
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
