import { notFound } from 'next/navigation';

import { redirect } from '@/i18n/routing';
import { ROUTES } from '@/shared/config/routes';

export const dynamic = 'force-dynamic';

const EXAM_TO_GOAL: Record<string, string> = {
  ort: 'exam_ort',
  ege: 'exam_ege',
  ielts: 'exam_ielts',
  toefl: 'exam_toefl',
  sat: 'exam_sat',
};

export default async function ExamRedirect({
  params,
}: {
  params: Promise<{ locale: string; exam: string }>;
}) {
  const { exam } = await params;
  const goal = EXAM_TO_GOAL[exam];
  if (!goal) notFound();
  redirect(ROUTES.catalogBy({ goal }));
}
