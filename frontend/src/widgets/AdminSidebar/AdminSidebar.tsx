'use client';

import {
  BarChart3,
  BookOpen,
  Building2,
  FileText,
  FolderTree,
  GraduationCap,
  Home,
  MessageSquare,
  Settings,
  UserCog,
  Users,
} from 'lucide-react';
import { usePathname } from 'next/navigation';

import { Link } from '@/i18n/routing';
import { ROUTES } from '@/shared/config/routes';
import { cn } from '@/shared/lib/cn';

import styles from './AdminSidebar.module.scss';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface Props {
  pendingTutors?: number;
  newFeedback?: number;
}

export function AdminSidebar({ pendingTutors = 0, newFeedback = 0 }: Props) {
  const pathname = usePathname();
  const stripLocale = (p: string) => p.replace(/^\/(ru|kg|en)(\/|$)/, '/');
  const current = stripLocale(pathname ?? '/');

  const groups: NavGroup[] = [
    {
      title: 'Обзор',
      items: [
        { href: ROUTES.admin.root, label: 'Дашборд', icon: <Home size={16} /> },
        { href: ROUTES.admin.users, label: 'Пользователи', icon: <Users size={16} /> },
      ],
    },
    {
      title: 'Контент',
      items: [
        {
          href: ROUTES.admin.tutors,
          label: 'Репетиторы',
          icon: <UserCog size={16} />,
          badge: pendingTutors > 0 ? pendingTutors : undefined,
        },
        { href: ROUTES.admin.posts, label: 'Статьи блога', icon: <FileText size={16} /> },
        { href: ROUTES.admin.categories, label: 'Категории', icon: <FolderTree size={16} /> },
        { href: ROUTES.admin.authors, label: 'Авторы', icon: <BookOpen size={16} /> },
      ],
    },
    {
      title: 'Общение',
      items: [
        {
          href: ROUTES.admin.feedback,
          label: 'Обращения',
          icon: <MessageSquare size={16} />,
          badge: newFeedback > 0 ? newFeedback : undefined,
        },
      ],
    },
    {
      title: 'Управление',
      items: [
        { href: ROUTES.admin.settings, label: 'Настройки', icon: <Settings size={16} /> },
        {
          href: ROUTES.admin.cities,
          label: 'Города',
          icon: <Building2 size={16} />,
        },
        {
          href: ROUTES.admin.subjects,
          label: 'Предметы',
          icon: <GraduationCap size={16} />,
        },
        { href: ROUTES.admin.analytics, label: 'Аналитика', icon: <BarChart3 size={16} /> },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === ROUTES.admin.root) return current === ROUTES.admin.root;
    return current === href || current.startsWith(`${href}/`);
  };

  return (
    <aside className={styles.sidebar}>
      {groups.map((group) => (
        <div key={group.title} className={styles.group}>
          <h4 className={styles.groupTitle}>{group.title}</h4>
          <ul className={styles.list}>
            {group.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(styles.link, isActive(item.href) && styles.active)}
                >
                  <span className={styles.icon}>{item.icon}</span>
                  <span className={styles.label}>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className={styles.badge}>{item.badge}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </aside>
  );
}
