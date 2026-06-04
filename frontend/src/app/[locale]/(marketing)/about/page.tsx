import { GraduationCap, Shield, Users } from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Link } from '@/i18n/routing';
import { ROUTES } from '@/shared/config/routes';
import { Container } from '@/shared/ui/Container';

import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'О нас',
  description: 'Команда Repka делает качественное образование доступным в Кыргызстане.',
};

const VALUES = [
  {
    icon: <GraduationCap size={20} />,
    title: 'Качество',
    text: 'Каждого репетитора проверяем — диплом, опыт и видео-визитку. Учеников ждут только проверенные педагоги.',
  },
  {
    icon: <Shield size={20} />,
    title: 'Прозрачность',
    text: 'Никаких скрытых комиссий. Цены, условия и контакты — открыто на странице репетитора.',
  },
  {
    icon: <Users size={20} />,
    title: 'Доступность',
    text: 'Репетитор для каждого: онлайн, у вас дома, у репетитора. По любому предмету — от школы до экзаменов и поступления.',
  },
];

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <section className={styles.section}>
      <Container>
        <header className={styles.hero}>
          <h1 className={styles.title}>
            Мы делаем качественное образование доступным
          </h1>
          <p className={styles.subtitle}>
            Repka — каталог проверенных репетиторов в Кыргызстане. Без комиссий за уроки и
            посредников.
          </p>
        </header>

        <section className={styles.story}>
          <h2 className={styles.h2}>Наша история</h2>
          <p>
            В Кыргызстане десятки тысяч учеников ищут репетиторов через мессенджеры,
            рассылки в чатах и сарафанное радио. Это работает — но плохо: непрозрачно,
            долго, без гарантий качества. Мы строим Repka, чтобы поиск репетитора стал
            простым и безопасным.
          </p>
          <p>
            На платформе размещаются только проверенные педагоги: с дипломом, опытом и
            подтверждёнными контактами. Ученик находит подходящего репетитора по предмету,
            цели и формату — и сразу связывается с ним напрямую. Все договорённости и оплата —
            между учеником и репетитором, мы в этом не участвуем.
          </p>
          <p>
            Repka не берёт комиссий с уроков и не зарабатывает на ставках репетиторов.
            Цены на занятия — между репетитором и учеником, без надбавок платформы.
          </p>
        </section>

        <section className={styles.values}>
          <h2 className={styles.h2}>Наши ценности</h2>
          <div className={styles.valuesGrid}>
            {VALUES.map((v) => (
              <div key={v.title} className={styles.valueCard}>
                <span className={styles.valueIcon}>{v.icon}</span>
                <h3 className={styles.valueTitle}>{v.title}</h3>
                <p className={styles.valueText}>{v.text}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className={styles.cta}>
          <h3 className={styles.ctaTitle}>Хотите рассказать историю или присоединиться?</h3>
          <p className={styles.ctaText}>
            Пишите нам — для прессы, партнёрств и общих вопросов.
          </p>
          <Link href={ROUTES.contacts} className={styles.ctaButton}>
            Связаться с нами
          </Link>
        </footer>
      </Container>
    </section>
  );
}
