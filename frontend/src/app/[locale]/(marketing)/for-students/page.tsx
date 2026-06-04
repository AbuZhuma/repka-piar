import type { Metadata } from 'next';
import {
  BadgeCheck,
  Calendar,
  ChevronRight,
  Compass,
  Filter,
  GraduationCap,
  HandCoins,
  HeartHandshake,
  Laptop,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';

import { Link } from '@/i18n/routing';
import { getPlatformStats, type PlatformStats } from '@/shared/api/stats';
import { ROUTES } from '@/shared/config/routes';
import { Container } from '@/shared/ui/Container';

import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Ученикам и родителям — Repka',
  description:
    'Найдите проверенного репетитора в Кыргызстане за пару минут. Без комиссий, без посредников, с понятными ценами.',
};

function buildStats(s: { tutors_total: number; subjects_total: number; cities_total: number }) {
  const fmt = (n: number) => (n >= 100 ? `${Math.floor(n / 10) * 10}+` : `${n}`);
  return [
    { value: s.tutors_total > 0 ? fmt(s.tutors_total) : '—', label: 'проверенных репетиторов' },
    { value: s.subjects_total > 0 ? fmt(s.subjects_total) : '—', label: 'предметов и направлений' },
    { value: s.cities_total > 0 ? `${s.cities_total}` : '—', label: 'городов покрытия' },
    { value: '0%', label: 'комиссии с уроков' },
  ];
}

const STEPS = [
  {
    icon: <Filter size={22} />,
    title: 'Откройте каталог и настройте фильтры',
    text: 'Выберите предмет, цель (школа, ОРТ, IELTS, олимпиада), формат — онлайн или офлайн, район города, бюджет. За пару кликов список сокращается до подходящих именно вам.',
  },
  {
    icon: <Compass size={22} />,
    title: 'Изучите анкеты',
    text: 'У каждого репетитора фото, опыт, образование, видеовизитка, отзывы и расписание. Сравнивайте кандидатов спокойно — данные проверены модераторами.',
  },
  {
    icon: <MessageCircle size={22} />,
    title: 'Свяжитесь напрямую',
    text: 'Контакты репетитора (WhatsApp, Telegram, телефон) открываются в один клик после простого подтверждения. Платформа не участвует в переписке.',
  },
  {
    icon: <GraduationCap size={22} />,
    title: 'Договоритесь и занимайтесь',
    text: 'Обсудите цели ребёнка, формат и расписание. Договорились — занимайтесь. Не подошёл репетитор? Вернитесь в каталог и выберите другого, мы вас не привязываем.',
  },
];

const BENEFITS = [
  {
    icon: <ShieldCheck size={22} />,
    title: 'Только проверенные педагоги',
    text: 'Каждый репетитор проходит модерацию: диплом, опыт, личное собеседование 30 минут. На профиль попадают только те, кому мы готовы доверить друзей.',
  },
  {
    icon: <HandCoins size={22} />,
    title: 'Никаких скрытых комиссий',
    text: 'Цена на странице репетитора — финальная. Вы платите ровно столько, сколько указано. Платформа не накручивает сверху.',
  },
  {
    icon: <Sparkles size={22} />,
    title: 'Прозрачные анкеты',
    text: 'Видно опыт, образование, программы, отзывы. У многих репетиторов есть видеовизитка — слышно манеру общения до первого звонка.',
  },
  {
    icon: <HeartHandshake size={22} />,
    title: 'Прямая связь, без агентов',
    text: 'Никаких менеджеров, операторов и call-центров. Контакты педагога — напрямую. Договариваетесь сами, как удобно.',
  },
  {
    icon: <Star size={22} />,
    title: 'Реальные отзывы',
    text: 'Отзывы пишут люди, которые занимались с педагогом. Мы вычищаем накрутку и не публикуем анонимные жалобы без проверки.',
  },
  {
    icon: <Users size={22} />,
    title: 'Помощь поддержки',
    text: 'Если возник вопрос или спорная ситуация — напишите нам. Мы разбираемся, помогаем найти альтернативу и предотвратить конфликт.',
  },
];

const SUBJECTS = [
  { label: 'Математика', href: '/catalog?subject=math' },
  { label: 'Английский', href: '/catalog?subject=english' },
  { label: 'Русский язык', href: '/catalog?subject=russian' },
  { label: 'Физика', href: '/catalog?subject=physics' },
  { label: 'Химия', href: '/catalog?subject=chemistry' },
  { label: 'Биология', href: '/catalog?subject=biology' },
  { label: 'Информатика', href: '/catalog?subject=informatics' },
  { label: 'ОРТ', href: '/catalog?goal=exam_ort' },
  { label: 'IELTS / TOEFL', href: '/catalog?goal=exam_ielts' },
  { label: 'Программирование', href: '/catalog?subject=programming' },
  { label: 'Кыргызский', href: '/catalog?subject=kyrgyz' },
  { label: 'Подготовка к школе', href: '/catalog?goal=school_prep' },
];

const FORMATS = [
  {
    icon: <Laptop size={20} />,
    title: 'Онлайн',
    text: 'Zoom, Skype, Google Meet. Подходит, если живёте в регионе, далеко от центра или у репетитора есть мечтательный график.',
  },
  {
    icon: <MapPin size={20} />,
    title: 'Офлайн',
    text: 'Дома у репетитора, у вас или в нейтральном месте — кафе, библиотека, коворкинг. Идеально для младших классов и подростков.',
  },
  {
    icon: <Users size={20} />,
    title: 'Мини-группы',
    text: 'Несколько детей одного уровня. Дешевле индивидуальных уроков, плюс ребёнку проще учиться в коллективе сверстников.',
  },
];

const TIPS = [
  {
    title: 'Сформулируйте цель чётко',
    text: 'Не «подтянуть математику», а «закрыть пробелы 7-го класса до конца четверти» или «сдать ОРТ на 200 баллов». Так педагог поймёт, что делать.',
  },
  {
    title: 'Не выбирайте только по цене',
    text: 'Самый дешёвый ≠ невыгодный, но и не лучший. Смотрите опыт, отзывы и совпадение по программе. Иногда дороже = меньше уроков до результата.',
  },
  {
    title: 'Возьмите пробный урок',
    text: 'Договоритесь о коротком вводном занятии — 30 минут. Так оба поймёте, есть ли контакт, и не зря ли потратите следующий месяц.',
  },
  {
    title: 'Договоритесь о формате обратной связи',
    text: 'Раз в две недели короткий отчёт: что прошли, где трудности, что задано. Это дисциплинирует обоих и помогает родителям быть в курсе.',
  },
  {
    title: 'Не бойтесь сменить репетитора',
    text: 'Если через 2–3 урока понимаете, что не идёт — не страдайте из вежливости. На платформе сотни педагогов, найдётся «свой».',
  },
];

const DO = [
  'Проверяем диплом и опыт каждого репетитора',
  'Созваниваемся с педагогом перед публикацией профиля',
  'Удобный поиск с фильтрами по предмету, цели и формату',
  'Прозрачные цены прямо на странице репетитора',
  'Помогаем разобраться в спорных ситуациях через поддержку',
];

const DONT = [
  'Не участвуем в финансовых отношениях с репетитором',
  'Не назначаем уроки и не следим за их посещаемостью',
  'Не отвечаем за содержание конкретных занятий',
  'Не сообщаем третьим лицам ваши контакты и историю поиска',
];

const FAQ = [
  {
    q: 'Сколько стоят уроки?',
    a: 'Каждый репетитор устанавливает цену сам. Диапазон по Бишкеку: 400–1500 сом за академический час, у топ-педагогов и подготовки к международным экзаменам — выше. Цена на странице — финальная.',
  },
  {
    q: 'Что если репетитор не подошёл?',
    a: 'Все договорённости — между вами и репетитором. Если что-то не подошло, выберите другого: на платформе сотни проверенных педагогов. Поддержка поможет, если хотите рекомендации.',
  },
  {
    q: 'Как платить за уроки?',
    a: 'Напрямую репетитору — наличными, переводом, по карте. Repka не участвует в платежах, поэтому никаких комиссий, удержаний и заморозок.',
  },
  {
    q: 'А ребёнок ещё маленький — есть подходящие?',
    a: 'Да, есть отдельная категория «подготовка к школе» и педагоги, работающие с младшими классами. В фильтрах укажите возраст ребёнка.',
  },
];

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function ForStudentsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  let stats: PlatformStats | null = null;
  try {
    stats = await getPlatformStats();
  } catch {
    /* network error — fall back to neutral placeholders in buildStats */
  }
  const statRows = buildStats(
    stats ?? { tutors_total: 0, subjects_total: 0, cities_total: 0 },
  );
  const subtitleStats = stats
    ? `${stats.tutors_total} проверенных педагогов, ${stats.subjects_total} предметов`
    : 'Проверенные педагоги, более 20 предметов';

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <Container>
          <span className={styles.heroEyebrow}>Для учеников и родителей</span>
          <h1 className={styles.heroTitle}>
            Найдите репетитора в Кыргызстане — без комиссий и посредников
          </h1>
          <p className={styles.heroSubtitle}>
            {subtitleStats}, прямые контакты и понятные цены. Договариваетесь напрямую —
            мы не вмешиваемся в платежи и уроки.
          </p>
          <div className={styles.heroActions}>
            <Link href={ROUTES.catalog} className={styles.btnPrimary}>
              <Search size={16} /> Найти репетитора
            </Link>
            <Link href={ROUTES.support} className={styles.btnGhost}>
              Часто задаваемые вопросы <ChevronRight size={16} />
            </Link>
          </div>

          <ul className={styles.statsBar}>
            {statRows.map((s) => (
              <li key={s.label} className={styles.statItem}>
                <strong className={styles.statValue}>{s.value}</strong>
                <span className={styles.statLabel}>{s.label}</span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className={styles.section}>
        <Container>
          <header className={styles.sectionHead}>
            <span className={styles.eyebrow}>Процесс</span>
            <h2 className={styles.h2}>Как найти своего репетитора</h2>
            <p className={styles.lede}>
              Четыре шага — от первого клика до первого урока. Обычно занимает один вечер.
            </p>
          </header>
          <ol className={styles.timeline}>
            {STEPS.map((s, i) => (
              <li key={s.title} className={styles.timelineItem}>
                <div className={styles.timelineMark}>
                  <span className={styles.timelineNum}>{i + 1}</span>
                </div>
                <div className={styles.timelineBody}>
                  <span className={styles.timelineIcon}>{s.icon}</span>
                  <h3 className={styles.timelineTitle}>{s.title}</h3>
                  <p className={styles.timelineText}>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className={styles.sectionAlt}>
        <Container>
          <header className={styles.sectionHead}>
            <span className={styles.eyebrow}>Почему Repka</span>
            <h2 className={styles.h2}>Шесть причин, почему ученики выбирают нас</h2>
          </header>
          <div className={styles.benefitsGrid}>
            {BENEFITS.map((b) => (
              <article key={b.title} className={styles.benefitCard}>
                <span className={styles.benefitIcon}>{b.icon}</span>
                <h3 className={styles.benefitTitle}>{b.title}</h3>
                <p className={styles.benefitText}>{b.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className={styles.section}>
        <Container>
          <header className={styles.sectionHead}>
            <span className={styles.eyebrow}>Предметы</span>
            <h2 className={styles.h2}>Что можно изучать</h2>
            <p className={styles.lede}>
              От школьной программы до международных экзаменов и хобби-навыков.
            </p>
          </header>
          <div className={styles.subjectsGrid}>
            {SUBJECTS.map((s) => (
              <Link key={s.label} href={s.href} className={styles.subjectChip}>
                {s.label}
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className={styles.sectionAlt}>
        <Container>
          <header className={styles.sectionHead}>
            <span className={styles.eyebrow}>Форматы</span>
            <h2 className={styles.h2}>Как проходят занятия</h2>
          </header>
          <div className={styles.formatsGrid}>
            {FORMATS.map((f) => (
              <article key={f.title} className={styles.formatCard}>
                <span className={styles.formatIcon}>{f.icon}</span>
                <h3 className={styles.formatTitle}>{f.title}</h3>
                <p className={styles.formatText}>{f.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className={styles.section}>
        <Container>
          <header className={styles.sectionHead}>
            <span className={styles.eyebrow}>Прозрачность</span>
            <h2 className={styles.h2}>Что мы делаем и чего не делаем</h2>
          </header>
          <div className={styles.doGrid}>
            <article className={styles.doCard}>
              <h3 className={styles.doTitleYes}>
                <BadgeCheck size={18} /> Что мы делаем
              </h3>
              <ul className={styles.doList}>
                {DO.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className={styles.doCard}>
              <h3 className={styles.doTitleNo}>
                <Calendar size={18} /> Чего мы не делаем
              </h3>
              <ul className={styles.doList}>
                {DONT.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </Container>
      </section>

      <section className={styles.sectionAlt}>
        <Container>
          <header className={styles.sectionHead}>
            <span className={styles.eyebrow}>Советы</span>
            <h2 className={styles.h2}>Как выбрать репетитора и не пожалеть</h2>
            <p className={styles.lede}>
              Короткие практичные советы — мы записали их за восемь лет работы с
              педагогами и семьями.
            </p>
          </header>
          <ol className={styles.tipsList}>
            {TIPS.map((tip, i) => (
              <li key={tip.title} className={styles.tipItem}>
                <span className={styles.tipNum}>{i + 1}</span>
                <div>
                  <h3 className={styles.tipTitle}>{tip.title}</h3>
                  <p className={styles.tipText}>{tip.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className={styles.section}>
        <Container>
          <header className={styles.sectionHead}>
            <span className={styles.eyebrow}>Вопросы</span>
            <h2 className={styles.h2}>Самое частое</h2>
          </header>
          <div className={styles.faqList}>
            {FAQ.map((f) => (
              <details key={f.q} className={styles.faqItem}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
          <div className={styles.faqMore}>
            Не нашли ответ?{' '}
            <Link href={ROUTES.support} className={styles.faqMoreLink}>
              Откройте раздел поддержки <ChevronRight size={14} />
            </Link>
          </div>
        </Container>
      </section>

      <section className={styles.ctaBlock}>
        <Container>
          <div className={styles.ctaInner}>
            <h2 className={styles.ctaTitle}>Готовы найти своего репетитора?</h2>
            <p className={styles.ctaText}>
              Перейдите в каталог и сравните анкеты. Это занимает 5–10 минут.
            </p>
            <div className={styles.ctaButtons}>
              <Link href={ROUTES.catalog} className={styles.btnPrimary}>
                <Search size={16} /> Открыть каталог
              </Link>
              <Link href={ROUTES.contacts} className={styles.btnOutline}>
                <Phone size={16} /> Связаться с поддержкой
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
