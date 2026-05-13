import { setRequestLocale } from 'next-intl/server';

import { BecomeTutorLanding } from '@/widgets/BecomeTutorLanding';

export default async function BecomeTutorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <BecomeTutorLanding />;
}
