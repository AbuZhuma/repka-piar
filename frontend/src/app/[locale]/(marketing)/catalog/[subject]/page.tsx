import { redirect } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export default async function SubjectRedirect({
  params,
}: {
  params: Promise<{ locale: string; subject: string }>;
}) {
  const { subject } = await params;
  redirect(`/catalog?subject=${encodeURIComponent(subject)}`);
}
