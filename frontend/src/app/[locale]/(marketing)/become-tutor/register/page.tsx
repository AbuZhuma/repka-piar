import { setRequestLocale } from 'next-intl/server';

import { TutorRegistrationFlow } from '@/widgets/TutorRegistrationFlow';

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TutorRegistrationFlow />;
}
