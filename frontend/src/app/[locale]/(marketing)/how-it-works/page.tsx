import { redirect } from '@/i18n/routing';

import { ROUTES } from '@/shared/config/routes';

export default function HowItWorksRedirect() {
  redirect(ROUTES.forStudents);
}
