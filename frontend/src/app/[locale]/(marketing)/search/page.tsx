import { redirect } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export default async function SearchRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  redirect(q ? `/catalog?q=${encodeURIComponent(q)}` : '/catalog');
}
