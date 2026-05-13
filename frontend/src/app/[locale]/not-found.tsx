import { Link } from '@/i18n/routing';
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
            <Link href="/" className={styles.btnPrimary}>
              На главную
            </Link>
            <Link href="/catalog" className={styles.btnSecondary}>
              Найти репетитора
            </Link>
            <Link href="/contacts" className={styles.btnGhost}>
              Связаться с поддержкой
            </Link>
          </div>

          <div className={styles.popular}>
            <h3 className={styles.popularTitle}>Популярные разделы</h3>
            <ul className={styles.popularList}>
              <li>
                <Link href="/catalog">Каталог репетиторов</Link>
              </li>
              <li>
                <Link href="/catalog?goal=exam_ort">Подготовка к ОРТ</Link>
              </li>
              <li>
                <Link href="/catalog?subject=english">Английский язык</Link>
              </li>
              <li>
                <Link href="/blog">Блог</Link>
              </li>
              <li>
                <Link href="/for-students">Ученикам и родителям</Link>
              </li>
              <li>
                <Link href="/for-tutors">Репетиторам</Link>
              </li>
              <li>
                <Link href="/support">Поддержка и FAQ</Link>
              </li>
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
