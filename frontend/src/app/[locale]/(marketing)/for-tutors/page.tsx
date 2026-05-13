import type { Metadata } from 'next';
import {
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileCheck,
  Headphones,
  Image as ImageIcon,
  LineChart,
  Mail,
  PhoneCall,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UserCheck,
  Video,
  Wallet,
} from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';

import { Link } from '@/i18n/routing';
import { ROUTES } from '@/shared/config/routes';
import { Container } from '@/shared/ui/Container';

import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Репетиторам — размещение профиля на Repka',
  description:
    'Размещение бесплатно, без комиссий с уроков. Ученики приходят к вам напрямую — мы только проверяем профиль и помогаем его правильно собрать.',
};

const HIGHLIGHTS = [
  { value: '0%', label: 'комиссии с уроков' },
  { value: '0 сом', label: 'размещение профиля' },
  { value: 'Своя', label: 'цена за час' },
  { value: '24–72 ч', label: 'модерация анкеты' },
];

const STEPS = [
  {
    icon: <UserCheck size={22} />,
    title: 'Заполните анкету',
    text: '10 простых шагов: данные, предметы, опыт, цена, расписание, фото. Большинство педагогов справляется за 15–20 минут.',
    detail: 'Можно сохранить черновик и вернуться позже',
  },
  {
    icon: <FileCheck size={22} />,
    title: 'Прикрепите документы',
    text: 'Диплом, сертификаты, дополнительные курсы. Чем больше — тем выше доверие учеников и быстрее идёт модерация.',
    detail: 'PDF, JPG, PNG — до 10 МБ на файл',
  },
  {
    icon: <PhoneCall size={22} />,
    title: 'Пройдите видеособеседование',
    text: 'Короткий звонок 20–30 минут с куратором. Подтверждаем личность, обсуждаем подход, отвечаем на ваши вопросы.',
    detail: 'Обычно в течение 1–3 рабочих дней',
  },
  {
    icon: <Rocket size={22} />,
    title: 'Профиль в каталоге',
    text: 'После проверки анкета публикуется. Контакты открыты для учеников. Можно редактировать профиль, расписание и цены в любой момент.',
    detail: 'Видимость — каталог, поиск, рекомендации',
  },
  {
    icon: <Mail size={22} />,
    title: 'Получайте заявки напрямую',
    text: 'Ученики пишут вам в WhatsApp, Telegram или звонят. Без посредников и операторов. Договоренности — между вами.',
    detail: 'Статистика просмотров и кликов в кабинете',
  },
];

const BENEFITS = [
  {
    icon: <Wallet size={22} />,
    title: 'Все деньги ваши',
    text: 'Repka не берёт процент с уроков и не накручивает цену сверху. Ученик платит ровно столько, сколько вы укажете в анкете.',
  },
  {
    icon: <ShieldCheck size={22} />,
    title: 'Доверие через модерацию',
    text: 'Все педагоги проходят проверку. Это отсекает случайных людей и поднимает доверие к каждому опубликованному профилю.',
  },
  {
    icon: <LineChart size={22} />,
    title: 'Своя статистика',
    text: 'В кабинете видно, сколько раз открыли вашу анкету, сколько людей кликнули по контактам. Понимаете, что работает.',
  },
  {
    icon: <Sparkles size={22} />,
    title: 'Свободный график',
    text: 'Вы сами решаете, когда заниматься и сколько брать учеников. Можно ставить на паузу — на каникулы, экзамены, отпуск.',
  },
  {
    icon: <Headphones size={22} />,
    title: 'Поддержка кураторов',
    text: 'Помогаем оформить анкету, подсказываем фотографии и формулировки. Решаем спорные ситуации с учениками.',
  },
  {
    icon: <Trophy size={22} />,
    title: 'Рост через отзывы',
    text: 'Хорошие отзывы → больше заявок и более высокая позиция в выдаче. Без рекламных бюджетов и платных продвижений.',
  },
];

const REQUIREMENTS = [
  'Подтверждённый диплом или документ об образовании',
  'Минимум 1 год опыта преподавания (репетиторство, школа, курсы)',
  'Возможность стабильно проводить занятия в выбранном формате',
  'Готовность к видеособеседованию с куратором',
  'Совершеннолетие и гражданство КР либо вид на жительство',
];

const GOOD_FIT = [
  'Преподаватели школ, колледжей и университетов',
  'Студенты старших курсов с опытом репетиторства',
  'Носители языков (английский, русский, кыргызский и др.)',
  'Профильные специалисты — программисты, дизайнеры, инженеры',
  'Педагоги по подготовке к ОРТ, ЕГЭ, IELTS, TOEFL',
  'Тренеры по олимпиадной подготовке',
];

const TIPS = [
  {
    icon: <ImageIcon size={20} />,
    title: 'Сделайте живое фото',
    text: 'Хорошее портретное фото — главный фактор клика. Без шапки, не селфи в зеркало, светлый фон. Можно улыбаться 🙂.',
  },
  {
    icon: <Video size={20} />,
    title: 'Запишите видео-визитку',
    text: 'Короткий ролик 60–90 секунд: как зовут, что преподаёте, для кого, чем отличаетесь. Заявок в среднем больше в 2–3 раза.',
  },
  {
    icon: <ClipboardCheck size={20} />,
    title: 'Опишите программы конкретно',
    text: 'Не «английский язык», а «английский для подготовки к IELTS Academic 6.5–7.5, программа 3–6 месяцев». Конкретика продаёт.',
  },
  {
    icon: <Star size={20} />,
    title: 'Просите отзывы у учеников',
    text: 'После хорошо прошедшего месяца попросите ученика оставить отзыв. Один отзыв в неделю — и через 2–3 месяца поток заявок растёт.',
  },
];

const DO = [
  'Проверяем документы, опыт и проводим видеособеседование',
  'Размещаем анкету бесплатно — без подписок и комиссий',
  'Помогаем оформить и улучшить профиль',
  'Защищаем от спама и недобросовестных учеников',
  'Решаем спорные ситуации через поддержку',
];

const DONT = [
  'Не берём процент с проведённых уроков',
  'Не назначаем расписание и не вмешиваемся в уроки',
  'Не выкупаем у вас контакты учеников и не перепродаём их',
  'Не показываем профиль без вашего согласия в рекламе',
];

const FAQ = [
  {
    q: 'Сколько стоит размещение?',
    a: 'Размещение полностью бесплатное. Никаких подписок, скрытых платежей или комиссий с уроков. Это базовое условие платформы и менять мы его не планируем.',
  },
  {
    q: 'Берёт ли Repka процент с уроков?',
    a: 'Нет. Все договорённости и расчёты — напрямую между вами и учеником. Платформа в этом не участвует и не хранит данные о ваших платежах.',
  },
  {
    q: 'Сколько занимает модерация?',
    a: 'Обычно 24 часа. Если документы сложные или потребовалось дополнительное собеседование — до 72 часов. Мы пишем на почту, когда профиль готов к публикации.',
  },
  {
    q: 'Что если я работаю в школе?',
    a: 'Это нормально. На платформе размещаются практикующие учителя и преподаватели вузов. Главное — не указывать рабочие контакты школы и согласовать совмещение, если нужно.',
  },
];

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function ForTutorsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <Container>
          <div className={styles.heroGrid}>
            <div className={styles.heroText}>
              <span className={styles.heroEyebrow}>Для репетиторов</span>
              <h1 className={styles.heroTitle}>
                Размещайтесь бесплатно. Ученики приходят сами.
              </h1>
              <p className={styles.heroSubtitle}>
                Repka — площадка для проверенных репетиторов Кыргызстана. Без комиссии с
                уроков, без подписок и платного продвижения. Только ваши деньги, ваше
                расписание, ваши ученики.
              </p>
              <div className={styles.heroActions}>
                <Link href={ROUTES.becomeTutor} className={styles.btnPrimary}>
                  <Rocket size={16} /> Стать репетитором
                </Link>
                <Link href={ROUTES.support} className={styles.btnGhost}>
                  Частые вопросы <ChevronRight size={16} />
                </Link>
              </div>
            </div>
            <ul className={styles.heroCards}>
              {HIGHLIGHTS.map((h) => (
                <li key={h.label} className={styles.heroCard}>
                  <strong className={styles.heroCardValue}>{h.value}</strong>
                  <span className={styles.heroCardLabel}>{h.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <section className={styles.section}>
        <Container>
          <header className={styles.sectionHead}>
            <span className={styles.eyebrow}>Процесс</span>
            <h2 className={styles.h2}>Пять шагов от анкеты до первой заявки</h2>
            <p className={styles.lede}>
              Обычно у нового педагога между регистрацией и первым учеником проходит от
              нескольких часов до пары недель — зависит от качества анкеты и нагрузки
              модерации.
            </p>
          </header>
          <ol className={styles.steps}>
            {STEPS.map((s, i) => (
              <li key={s.title} className={styles.stepRow}>
                <span className={styles.stepNum}>{String(i + 1).padStart(2, '0')}</span>
                <div className={styles.stepIconWrap}>{s.icon}</div>
                <div className={styles.stepBody}>
                  <h3 className={styles.stepTitle}>{s.title}</h3>
                  <p className={styles.stepText}>{s.text}</p>
                  <span className={styles.stepDetail}>{s.detail}</span>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className={styles.sectionAlt}>
        <Container>
          <header className={styles.sectionHead}>
            <span className={styles.eyebrow}>Что вы получаете</span>
            <h2 className={styles.h2}>Шесть преимуществ платформы Repka</h2>
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

      <section className={styles.sectionSplit}>
        <Container>
          <div className={styles.splitGrid}>
            <article className={styles.splitCard}>
              <span className={styles.eyebrow}>Требования</span>
              <h2 className={styles.splitTitle}>Что нужно для регистрации</h2>
              <ul className={styles.checkList}>
                {REQUIREMENTS.map((r) => (
                  <li key={r}>
                    <CheckCircle2 size={18} /> {r}
                  </li>
                ))}
              </ul>
            </article>
            <article className={styles.splitCard}>
              <span className={styles.eyebrow}>Кому подходит</span>
              <h2 className={styles.splitTitle}>Кого мы ждём на платформе</h2>
              <ul className={styles.checkList}>
                {GOOD_FIT.map((r) => (
                  <li key={r}>
                    <CheckCircle2 size={18} /> {r}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </Container>
      </section>

      <section className={styles.sectionAlt}>
        <Container>
          <header className={styles.sectionHead}>
            <span className={styles.eyebrow}>Практика</span>
            <h2 className={styles.h2}>Как привлечь больше учеников</h2>
            <p className={styles.lede}>
              Наблюдения за теми, кто получает на Repka в разы больше заявок.
            </p>
          </header>
          <div className={styles.tipsGrid}>
            {TIPS.map((tip) => (
              <article key={tip.title} className={styles.tipCard}>
                <span className={styles.tipIcon}>{tip.icon}</span>
                <h3 className={styles.tipTitle}>{tip.title}</h3>
                <p className={styles.tipText}>{tip.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className={styles.section}>
        <Container>
          <header className={styles.sectionHead}>
            <span className={styles.eyebrow}>Прозрачность</span>
            <h2 className={styles.h2}>Что мы делаем для вас и чего не делаем</h2>
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
                <ShieldCheck size={18} /> Чего мы не делаем
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
            <span className={styles.eyebrow}>Вопросы</span>
            <h2 className={styles.h2}>Самое частое от репетиторов</h2>
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
              Полный раздел поддержки <ChevronRight size={14} />
            </Link>
          </div>
        </Container>
      </section>

      <section className={styles.ctaBlock}>
        <Container>
          <div className={styles.ctaInner}>
            <h2 className={styles.ctaTitle}>Готовы начать преподавать на Repka?</h2>
            <p className={styles.ctaText}>
              Заполните анкету за 15 минут — мы поможем с оформлением, и в течение пары
              дней профиль будет в каталоге.
            </p>
            <div className={styles.ctaButtons}>
              <Link href={ROUTES.becomeTutor} className={styles.btnPrimary}>
                <Rocket size={16} /> Заполнить анкету
              </Link>
              <Link href={ROUTES.contacts} className={styles.btnOutline}>
                <Mail size={16} /> Задать вопрос куратору
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
