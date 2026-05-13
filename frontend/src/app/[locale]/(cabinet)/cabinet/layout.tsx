import type { ReactNode } from 'react';

import { CabinetLayout } from '@/widgets/CabinetLayout';

export default function CabinetRootLayout({ children }: { children: ReactNode }) {
  return <CabinetLayout>{children}</CabinetLayout>;
}
