import { redirect } from '@/i18n/routing';

import { ROUTES } from '@/shared/config/routes';

export const dynamic = 'force-dynamic';

export default async function SubjectRedirect({
  params,
}: {
  params: Promise<{ locale: string; subject: string }>;
}) {
  const { subject } = await params;
  redirect(ROUTES.catalogBy({ subject }));
}
