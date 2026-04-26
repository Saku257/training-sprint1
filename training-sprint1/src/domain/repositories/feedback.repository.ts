import { SupabaseClient } from '@supabase/supabase-js';
import type { FeedbackValue, FeedbackResult } from '@/domain/models/feedback';

export class FeedbackRepository {
  constructor(private client: SupabaseClient) {}

  async create(faqId: string, value: FeedbackValue): Promise<FeedbackResult> {
    const { data, error } = await this.client
      .from('feedback')
      .insert({ faq_id: faqId, value })
      .select('id, faq_id, value, submitted_at')
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to create feedback');
    }

    return {
      id: data.id as string,
      faqId: data.faq_id as string,
      value: data.value as FeedbackValue,
      submittedAt: data.submitted_at as string,
    };
  }
}
