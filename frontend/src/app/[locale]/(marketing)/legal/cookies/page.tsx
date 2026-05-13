import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { LegalDocLayout } from '@/widgets/LegalDocLayout';

export const metadata: Metadata = {
  title: 'Политика cookies',
  description: 'Какие cookies использует Repka и как ими управлять.',
};

const TOC = [
  { id: 'what', label: '1. Что такое cookies' },
  { id: 'types', label: '2. Какие cookies мы используем' },
  { id: 'manage', label: '3. Как управлять cookies' },
  { id: 'third-party', label: '4. Cookies третьих сторон' },
];

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <LegalDocLayout title="Политика cookies" lastUpdated="01.01.2026" toc={TOC}>
      <section id="what">
        <h2>1. Что такое cookies</h2>
        <p>
          Cookies — это небольшие текстовые файлы, которые сайты сохраняют в браузере
          пользователя. Они помогают сайту запоминать ваши настройки, сохранять сессию
          входа и собирать обезличенную статистику.
        </p>
      </section>

      <section id="types">
        <h2>2. Какие cookies мы используем</h2>
        <h3>Необходимые</h3>
        <p>
          Без них сайт не работает. К ним относятся: cookies сессии (вы остаётесь
          залогинены), cookies согласия с условиями. Эти cookies не отключаются.
        </p>

        <h3>Аналитические</h3>
        <p>
          Помогают понимать, как посетители используют сайт: какие страницы открывают,
          как долго остаются. Используем для улучшения сервиса. Отключаются в настройках
          согласия.
        </p>

        <h3>Маркетинговые</h3>
        <p>
          Используются для измерения эффективности рекламных кампаний и показа
          релевантной рекламы. Отключаются в настройках согласия.
        </p>
      </section>

      <section id="manage">
        <h2>3. Как управлять cookies</h2>
        <p>
          При первом визите вы видите баннер согласия. Можно принять все cookies, только
          необходимые или настроить выбор. Изменить настройки можно в любой момент,
          очистив cookies сайта в браузере и перезагрузив страницу.
        </p>
        <p>
          Также cookies можно полностью отключить в настройках браузера, но в этом
          случае некоторые функции сайта могут работать некорректно.
        </p>
      </section>

      <section id="third-party">
        <h2>4. Cookies третьих сторон</h2>
        <p>
          На страницах сайта могут устанавливаться cookies от сторонних сервисов:
          Google Analytics, Yandex.Metrica и других, если они подключены и вы дали
          согласие на аналитические cookies.
        </p>
      </section>
    </LegalDocLayout>
  );
}
