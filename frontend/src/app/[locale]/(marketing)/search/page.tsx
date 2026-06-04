import { redirect } from '@/i18n/routing';

import { ROUTES } from '@/shared/config/routes';

export const dynamic = 'force-dynamic';

export default async function SearchRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  redirect(q ? ROUTES.catalogBy({ q }) : ROUTES.catalog);
}
