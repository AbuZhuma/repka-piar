'use client';

import { useTranslations } from 'next-intl';

import {
  ProgressBar,
  Step10Confirmation,
  Step1Contacts,
  Step2About,
  Step3Education,
  Step4Subjects,
  Step5Certificates,
  Step6Video,
  Step7Prices,
  Step8Contacts,
  Step9Schedule,
  TOTAL_STEPS,
  useRegistrationStore,
} from '@/features/tutor-registration';
import { Container } from '@/shared/ui/Container';

import styles from './TutorRegistrationFlow.module.scss';

export function TutorRegistrationFlow() {
  const t = useTranslations('register');
  const step = useRegistrationStore((s) => s.currentStep);

  return (
    <div className={styles.flow}>
      <div className={styles.progressBar}>
        <Container>
          <h1 className={styles.title}>{t('title')}</h1>
          <ProgressBar current={step} total={TOTAL_STEPS} />
        </Container>
      </div>

      <Container className={styles.content}>
        {step === 1 && <Step1Contacts />}
        {step === 2 && <Step2About />}
        {step === 3 && <Step3Education />}
        {step === 4 && <Step4Subjects />}
        {step === 5 && <Step5Certificates />}
        {step === 6 && <Step6Video />}
        {step === 7 && <Step7Prices />}
        {step === 8 && <Step8Contacts />}
        {step === 9 && <Step9Schedule />}
        {step === 10 && <Step10Confirmation />}
      </Container>
    </div>
  );
}
