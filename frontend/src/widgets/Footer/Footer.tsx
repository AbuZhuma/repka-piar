import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/routing';
import { ROUTES } from '@/shared/config/routes';
import { Container } from '@/shared/ui/Container';
import { Logo } from '@/shared/ui/Logo';

import styles from './Footer.module.scss';

export function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('navigation');

  const columns = [
    {
      title: t('for_students'),
      links: [
        { href: ROUTES.catalog, label: t('links.catalog') },
        { href: ROUTES.forStudents, label: t('links.for_students') },
        { href: ROUTES.catalogBy({ goal: 'exam_ort' }), label: t('links.exam_prep') },
      ],
    },
    {
      title: t('for_tutors'),
      links: [
        { href: ROUTES.becomeTutor, label: t('links.become_tutor') },
        { href: ROUTES.forTutors, label: t('links.for_tutors') },
      ],
    },
    {
      title: t('company'),
      links: [
        { href: ROUTES.about, label: t('links.about') },
        { href: ROUTES.blog, label: t('links.blog') },
        { href: ROUTES.support, label: t('links.support') },
        { href: ROUTES.contacts, label: t('links.contacts') },
      ],
    },
    {
      title: t('legal'),
      links: [
        { href: ROUTES.legal.offer, label: t('links.offer') },
        { href: ROUTES.legal.privacy, label: t('links.privacy') },
        { href: ROUTES.legal.cookie, label: t('links.cookie') },
        { href: ROUTES.legal.rules, label: t('links.rules') },
      ],
    },
  ];

  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.top}>
          <div className={styles.brand}>
            <Logo size="md" />
            <p className={styles.tagline}>{t('tagline')}</p>
          </div>
          <div className={styles.columns}>
            {columns.map((col) => (
              <section key={col.title} className={styles.column}>
                <h3 className={styles.columnTitle}>{col.title}</h3>
                <ul className={styles.linkList}>
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className={styles.link}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
        <div className={styles.bottom}>
          <span className={styles.rights}>{t('rights')}</span>
          <Link href={ROUTES.contacts} className={styles.bottomLink}>
            {tNav('contacts')}
          </Link>
        </div>
      </Container>
    </footer>
  );
}
