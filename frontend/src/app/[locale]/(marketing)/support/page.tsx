'use client';

import {
  AlertTriangle,
  ChevronDown,
  CreditCard,
  GraduationCap,
  HelpCircle,
  Mail,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Link } from '@/i18n/routing';
import { ROUTES } from '@/shared/config/routes';
import { Container } from '@/shared/ui/Container';
import { cn } from '@/shared/lib/cn';

import styles from './page.module.scss';

interface QA {
  q: string;
  a: string;
}

interface Category {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  items: QA[];
}

const CATEGORIES: Category[] = [
  {
    id: 'general',
    label: 'Общие вопросы',
    icon: <Sparkles size={18} />,
    description: 'Что такое Repka, как мы работаем и на чём зарабатываем.',
    items: [
      {
        q: 'Что такое Repka?',
        a: 'Repka — площадка, на которой ученики и родители из Кыргызстана находят проверенных репетиторов. Мы проверяем педагогов перед публикацией и помогаем сторонам связаться напрямую, но не участвуем в уроках и платежах.',
      },
      {
        q: 'На чём зарабатывает Repka?',
        a: 'Платформа не берёт комиссию с уроков и не накручивает цену сверху. На данный момент мы развиваем продукт и не показываем платную рекламу другим компаниям. Если это изменится — мы заранее уведомим всех пользователей и опубликуем условия открыто.',
      },
      {
        q: 'В каких городах работает платформа?',
        a: 'Сейчас основной фокус — Бишкек, Ош, Каракол, Джалал-Абад, Талас и Нарын. Онлайн-уроки доступны по всей стране и за её пределами.',
      },
      {
        q: 'Есть ли мобильное приложение?',
        a: 'Сайт оптимизирован под телефоны и планшеты. Полноценное приложение в работе — расскажем, когда будет готова бета-версия.',
      },
    ],
  },
  {
    id: 'students',
    label: 'Для учеников и родителей',
    icon: <GraduationCap size={18} />,
    description: 'Поиск, выбор репетитора, занятия и оплата уроков.',
    items: [
      {
        q: 'Как найти подходящего репетитора?',
        a: 'Откройте каталог и используйте фильтры: предмет, цель (школа, ОРТ, IELTS и т. д.), формат (онлайн или офлайн), бюджет, район. Можно сравнить анкеты и связаться напрямую через WhatsApp, Telegram или по телефону.',
      },
      {
        q: 'Сколько стоят уроки?',
        a: 'Цены устанавливают сами репетиторы. По Бишкеку диапазон — обычно 400–1500 сом за академический час. Цена на странице репетитора — финальная, без скрытых надбавок.',
      },
      {
        q: 'Как оплачивать уроки?',
        a: 'Напрямую репетитору: наличными, переводом или картой — как договоритесь. Платформа в платежах не участвует.',
      },
      {
        q: 'Что делать, если репетитор не подошёл?',
        a: 'Все договорённости — между вами и педагогом. Если что-то не подошло, выберите другого. Поддержка может помочь с подбором или порекомендовать альтернативу.',
      },
      {
        q: 'Можно ли заниматься онлайн?',
        a: 'Да. У большинства репетиторов в анкете указан формат «онлайн» — занятия проходят в Zoom, Skype, Google Meet или другом удобном сервисе.',
      },
      {
        q: 'Безопасно ли оставлять контакты?',
        a: 'Мы открываем контакты репетитора только после простого подтверждения. Контакты учеников видят только те репетиторы, которым вы написали сами.',
      },
    ],
  },
  {
    id: 'tutors',
    label: 'Для репетиторов',
    icon: <UserRound size={18} />,
    description: 'Регистрация, модерация, профиль и привлечение учеников.',
    items: [
      {
        q: 'Сколько стоит размещение?',
        a: 'Размещение полностью бесплатное. Никаких подписок, скрытых платежей или комиссий с уроков.',
      },
      {
        q: 'Берёт ли Repka процент с уроков?',
        a: 'Нет. Все договорённости и расчёты — напрямую между репетитором и учеником. Платформа в этом не участвует.',
      },
      {
        q: 'Сколько занимает модерация?',
        a: 'Обычно 24 часа. Если документы сложные или нужна дополнительная проверка — до 72 часов. Уведомление о публикации придёт на email.',
      },
      {
        q: 'Какие документы нужны?',
        a: 'Диплом или документ об образовании, по желанию — сертификаты курсов и подтверждения опыта. Чем больше документов, тем выше доверие учеников и быстрее идёт модерация.',
      },
      {
        q: 'Можно ли поменять цену или расписание?',
        a: 'Да, в любой момент через личный кабинет. Изменения отображаются в каталоге сразу после сохранения.',
      },
      {
        q: 'Что если я работаю в школе или вузе?',
        a: 'Многие наши педагоги — практикующие учителя и преподаватели. Главное — не указывать в анкете рабочие контакты учреждения.',
      },
    ],
  },
  {
    id: 'payments',
    label: 'Оплата и цены',
    icon: <CreditCard size={18} />,
    description: 'Как формируются цены, кто принимает оплату, есть ли возврат.',
    items: [
      {
        q: 'Repka берёт комиссию?',
        a: 'Нет. С уроков комиссия не взимается, размещение для репетиторов бесплатное.',
      },
      {
        q: 'Как формируется цена?',
        a: 'Цену устанавливает сам репетитор. Платформа не накручивает наценку и не диктует размер ставок.',
      },
      {
        q: 'Что делать, если репетитор просит предоплату?',
        a: 'Это нормально для первых уроков и для бронирования пакета. Но если сумма большая или педагог давит — посоветуйтесь с поддержкой перед оплатой. Лучше начать с одного оплаченного занятия и решать дальше.',
      },
      {
        q: 'Можно ли вернуть деньги за неудачный урок?',
        a: 'Возврат — вопрос между вами и репетитором, мы в платежах не участвуем. Если возникла спорная ситуация, напишите поддержке — мы постараемся помочь договориться.',
      },
    ],
  },
  {
    id: 'safety',
    label: 'Безопасность и приватность',
    icon: <ShieldCheck size={18} />,
    description: 'Как мы защищаем ваши данные и кому они доступны.',
    items: [
      {
        q: 'Кому доступны мои данные?',
        a: 'Контакты ученика видны только тем репетиторам, которым он написал. Контакты репетитора открываются ученикам по нажатию кнопки. Мы не передаём данные третьим лицам и не продаём их.',
      },
      {
        q: 'Как хранятся документы?',
        a: 'Документы репетиторов хранятся в защищённом хранилище и доступны только команде модерации. Они не показываются ученикам и не передаются никому, кроме случаев, прямо предусмотренных законом КР.',
      },
      {
        q: 'Можно ли удалить аккаунт?',
        a: 'Да. В личном кабинете есть кнопка удаления. После удаления профиль скрывается, личные данные стираются. Часть данных может храниться в виде обезличенной статистики.',
      },
      {
        q: 'Что делать, если я получил спам с платформы?',
        a: 'Напишите нам — расследуем и заблокируем источник. Платформа не использует ваши контакты для рассылок без согласия.',
      },
    ],
  },
  {
    id: 'disputes',
    label: 'Жалобы и спорные ситуации',
    icon: <AlertTriangle size={18} />,
    description: 'Что делать, если возник конфликт или нашли нарушение.',
    items: [
      {
        q: 'Как пожаловаться на репетитора?',
        a: 'Напишите на support@repka.kg или через форму на странице «Контакты». Приложите факты: переписка, скрины, имена и даты. Мы изучаем каждую жалобу и можем скрыть профиль на время проверки.',
      },
      {
        q: 'Что считается нарушением?',
        a: 'Мошенничество, обман с документами, грубое поведение, запрос непрозрачных предоплат, попытка обойти платформу, нарушения 18+ или законодательства КР. Платформа оставляет за собой право заблокировать профиль.',
      },
      {
        q: 'Можно ли пожаловаться анонимно?',
        a: 'Можно. Но если у нас не будет контактов для уточнений, проверка займёт дольше. Мы не публикуем имена жалобщиков.',
      },
      {
        q: 'Что если я не согласен с решением модерации?',
        a: 'Напишите письмо на support@repka.kg, объясните позицию и приложите доказательства. Жалобы повторно рассматривает старший куратор.',
      },
    ],
  },
];

const CONTACTS = [
  {
    icon: <Mail size={20} />,
    label: 'Email поддержки',
    value: 'support@repka.kg',
    href: 'mailto:support@repka.kg',
    hint: 'Отвечаем в рабочие дни в течение 24 часов',
  },
  {
    icon: <MessageSquare size={20} />,
    label: 'Telegram',
    value: '@repka_support',
    href: 'https://t.me/repka_support',
    hint: 'Самый быстрый канал — обычно в течение часа',
  },
  {
    icon: <HelpCircle size={20} />,
    label: 'Форма обратной связи',
    value: 'Перейти к форме',
    href: ROUTES.contacts,
    hint: 'Можно прикрепить скриншоты и файлы',
  },
];

export default function SupportPage() {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<string>('general');

  const filtered = useMemo(() => {
    if (!query.trim()) return CATEGORIES;
    const q = query.toLowerCase().trim();
    return CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (it) => it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q),
      ),
    })).filter((cat) => cat.items.length > 0);
  }, [query]);

  const totalHits = filtered.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <Container>
          <span className={styles.heroEyebrow}>Центр поддержки</span>
          <h1 className={styles.heroTitle}>Помощь и часто задаваемые вопросы</h1>
          <p className={styles.heroSubtitle}>
            Ответы на самое частое — от регистрации до спорных ситуаций. Если ответа нет —
            напишите команде поддержки, постараемся помочь.
          </p>

          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Поиск по вопросам и ответам…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Поиск по поддержке"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className={styles.searchClear}
              >
                Сбросить
              </button>
            )}
          </div>
          {query && (
            <p className={styles.searchHint}>
              Найдено {totalHits}{' '}
              {totalHits === 1 ? 'ответ' : totalHits < 5 ? 'ответа' : 'ответов'} по запросу
              «{query}»
            </p>
          )}
        </Container>
      </section>

      <section className={styles.contactsRow}>
        <Container>
          <div className={styles.contactsGrid}>
            {CONTACTS.map((c) => (
              <a
                key={c.label}
                href={c.href}
                className={styles.contactCard}
                target={c.href.startsWith('http') ? '_blank' : undefined}
                rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                <span className={styles.contactIcon}>{c.icon}</span>
                <div>
                  <span className={styles.contactLabel}>{c.label}</span>
                  <strong className={styles.contactValue}>{c.value}</strong>
                  <span className={styles.contactHint}>{c.hint}</span>
                </div>
              </a>
            ))}
          </div>
        </Container>
      </section>

      <section className={styles.faqSection}>
        <Container>
          <div className={styles.faqLayout}>
            <aside className={styles.faqNav}>
              <span className={styles.faqNavTitle}>Категории</span>
              <ul className={styles.faqNavList}>
                {CATEGORIES.map((cat) => {
                  const visible = filtered.find((f) => f.id === cat.id);
                  const count = visible?.items.length ?? 0;
                  const disabled = query.trim() !== '' && count === 0;
                  return (
                    <li key={cat.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setActive(cat.id);
                          if (typeof window !== 'undefined') {
                            const el = document.getElementById(`cat-${cat.id}`);
                            el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                        disabled={disabled}
                        className={cn(
                          styles.faqNavBtn,
                          active === cat.id && styles.faqNavBtnActive,
                          disabled && styles.faqNavBtnDisabled,
                        )}
                      >
                        <span className={styles.faqNavIcon}>{cat.icon}</span>
                        <span className={styles.faqNavLabel}>{cat.label}</span>
                        <span className={styles.faqNavCount}>{count}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>

            <div className={styles.faqContent}>
              {filtered.length === 0 ? (
                <div className={styles.faqEmpty}>
                  <HelpCircle size={32} />
                  <h3>Ничего не нашли</h3>
                  <p>
                    Попробуйте другой запрос или напишите команде поддержки —{' '}
                    <a href="mailto:support@repka.kg">support@repka.kg</a>.
                  </p>
                </div>
              ) : (
                filtered.map((cat) => (
                  <section key={cat.id} id={`cat-${cat.id}`} className={styles.faqCategory}>
                    <header className={styles.faqCatHead}>
                      <span className={styles.faqCatIcon}>{cat.icon}</span>
                      <div>
                        <h2 className={styles.faqCatTitle}>{cat.label}</h2>
                        <p className={styles.faqCatDesc}>{cat.description}</p>
                      </div>
                    </header>
                    <div className={styles.faqList}>
                      {cat.items.map((it) => (
                        <details key={it.q} className={styles.faqItem}>
                          <summary>
                            <span>{it.q}</span>
                            <ChevronDown size={18} className={styles.faqChevron} />
                          </summary>
                          <p>{it.a}</p>
                        </details>
                      ))}
                    </div>
                  </section>
                ))
              )}
            </div>
          </div>
        </Container>
      </section>

      <section className={styles.ctaBlock}>
        <Container>
          <div className={styles.ctaInner}>
            <h2 className={styles.ctaTitle}>Не нашли ответ?</h2>
            <p className={styles.ctaText}>
              Напишите нам через форму обратной связи. Опишите ситуацию, можно приложить
              скриншоты — мы изучаем каждое обращение и стараемся ответить в течение суток.
            </p>
            <div className={styles.ctaButtons}>
              <Link href={ROUTES.contacts} className={styles.btnPrimary}>
                <Mail size={16} /> Открыть форму обращения
              </Link>
              <a
                href="https://t.me/repka_support"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.btnOutline}
              >
                <MessageSquare size={16} /> Написать в Telegram
              </a>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
