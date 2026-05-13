import { useTranslations } from 'next-intl';

import styles from '../login/page.module.scss';

export default function RegisterPage() {
  const t = useTranslations('auth');
  return (
    <div className={styles.card}>
      <h1 className={styles.title}>{t('register_title')}</h1>
      <p className={styles.stub}>{t('stub')}</p>
    </div>
  );
}
