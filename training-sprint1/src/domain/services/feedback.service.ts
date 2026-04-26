import type { FeedbackRepository } from '@/domain/repositories/feedback.repository';
import type { FeedbackValue, FeedbackResult } from '@/domain/models/feedback';

export class FeedbackService {
  constructor(private repository: FeedbackRepository) {}

  async submitFeedback(faqId: string, value: FeedbackValue): Promise<FeedbackResult> {
    if (value !== 'solved' && value !== 'unsolved') {
      throw new Error('INVALID_FEEDBACK_VALUE');
    }
    return this.repository.create(faqId, value);
  }
}
