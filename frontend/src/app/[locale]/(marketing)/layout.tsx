import type { ReactNode } from 'react';

import { CookieBanner } from '@/widgets/CookieBanner';
import { Footer } from '@/widgets/Footer';
import { Header } from '@/widgets/Header';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <CookieBanner />
    </>
  );
}
