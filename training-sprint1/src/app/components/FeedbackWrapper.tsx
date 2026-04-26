'use client';

import { FeedbackButtons } from '@/app/components/FeedbackButtons';
import type { FeedbackValue } from '@/domain/models/feedback';

type Props = {
  faqId: string;
};

export function FeedbackWrapper({ faqId }: Props) {
  const handleFeedback = async (value: FeedbackValue) => {
    await fetch(`/api/faqs/${faqId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
  };

  return <FeedbackButtons onFeedback={handleFeedback} />;
}
