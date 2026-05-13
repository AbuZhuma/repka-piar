'use client';

import {
  Clock,
  Eye,
  FileText,
  MessageSquare,
  MousePointerClick,
  UserPlus,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Link } from '@/i18n/routing';
import type { DashboardStats } from '@/shared/api/admin';
import { getDashboard } from '@/shared/api/admin';
import { cn } from '@/shared/lib/cn';

import styles from './AdminDashboard.module.scss';

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then(setStats)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Не удалось загрузить'));
  }, []);

  if (error) return <div className={styles.error}>{error}</div>;
  if (!stats) return <div className={styles.loading}>Загрузка...</div>;

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.title}>Дашборд</h1>
        <p className={styles.subtitle}>Что произошло за последние 7 дней</p>
      </header>

      <div className={styles.stats}>
        <StatCard
          icon={<Users size={20} />}
          label="Всего репетиторов"
          value={stats.tutors.total}
          sub={`+${stats.tutors.new_this_week} за неделю`}
        />
        <StatCard
          icon={<Clock size={20} />}
          label="На проверке"
          value={stats.tutors.pending_verification}
          highlight={stats.tutors.pending_verification > 0}
          href="/admin/tutors?status=pending"
        />
        <StatCard
          icon={<Eye size={20} />}
          label="Просмотры (нед.)"
          value={stats.activity.profile_views_week}
        />
        <StatCard
          icon={<MousePointerClick size={20} />}
          label="Клики на контакты (нед.)"
          value={stats.activity.contact_clicks_week}
        />
        <StatCard
          icon={<UserPlus size={20} />}
          label="Регистрации (нед.)"
          value={stats.activity.registrations_week}
        />
        <StatCard
          icon={<FileText size={20} />}
          label="Опубликованных статей"
          value={stats.posts.published}
          sub={`Черновиков: ${stats.posts.drafts}`}
          href="/admin/posts"
        />
        <StatCard
          icon={<MessageSquare size={20} />}
          label="Новые обращения"
          value={stats.feedback.new}
          highlight={stats.feedback.new > 0}
          href="/admin/feedback?status=new"
        />
      </div>

      <section className={styles.attention}>
        <h2 className={styles.sectionTitle}>Требует внимания</h2>
        <ul className={styles.actionList}>
          {stats.tutors.pending_verification > 0 && (
            <li>
              <Link href="/admin/tutors?status=pending" className={styles.actionLink}>
                <Clock size={16} />
                <span>{stats.tutors.pending_verification} репетиторов на верификации</span>
              </Link>
            </li>
          )}
          {stats.feedback.unread > 0 && (
            <li>
              <Link href="/admin/feedback" className={styles.actionLink}>
                <MessageSquare size={16} />
                <span>{stats.feedback.unread} необработанных обращений</span>
              </Link>
            </li>
          )}
          {stats.posts.drafts > 0 && (
            <li>
              <Link href="/admin/posts?status=draft" className={styles.actionLink}>
                <FileText size={16} />
                <span>{stats.posts.drafts} черновиков статей</span>
              </Link>
            </li>
          )}
          {stats.tutors.pending_verification === 0 &&
            stats.feedback.unread === 0 &&
            stats.posts.drafts === 0 && <li className={styles.empty}>Всё под контролем 👌</li>}
        </ul>
      </section>

      {stats.recent_pending_tutors.length > 0 && (
        <section className={styles.attention}>
          <h2 className={styles.sectionTitle}>Последние заявки на верификацию</h2>
          <div className={styles.cards}>
            {stats.recent_pending_tutors.map((t) => (
              <Link
                key={t.id}
                href={`/admin/tutors/${t.id}`}
                className={styles.tutorCard}
              >
                <strong>
                  {t.name} {t.surname}
                </strong>
                <span className={styles.muted}>{t.email}</span>
                <span className={styles.muted}>опыт: {t.experience_years} лет</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  href,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
  href?: string;
  highlight?: boolean;
}) {
  const inner = (
    <div className={cn(styles.statCard, highlight && styles.statHighlight)}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statBody}>
        <span className={styles.statLabel}>{label}</span>
        <span className={styles.statValue}>{value.toLocaleString('ru-RU')}</span>
        {sub && <span className={styles.statSub}>{sub}</span>}
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className={styles.statLink}>
      {inner}
    </Link>
  ) : (
    inner
  );
}
