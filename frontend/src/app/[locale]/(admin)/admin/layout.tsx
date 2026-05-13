import type { ReactNode } from 'react';

import { ProtectedAdminRoute } from '@/features/admin-auth';
import { AdminHeader } from '@/widgets/AdminHeader';
import { AdminSidebar } from '@/widgets/AdminSidebar';

import styles from './layout.module.scss';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedAdminRoute>
      <div className={styles.shell}>
        <AdminHeader />
        <div className={styles.body}>
          <AdminSidebar />
          <main className={styles.main}>{children}</main>
        </div>
      </div>
    </ProtectedAdminRoute>
  );
}
