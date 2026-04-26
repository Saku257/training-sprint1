import { SupabaseClient } from '@supabase/supabase-js';
import type { QuestionSuggestionItem } from '@/domain/models/chat';

export class QuestionSuggestionRepository {
  constructor(private client: SupabaseClient) {}

  async findAll(limit: number): Promise<QuestionSuggestionItem[]> {
    const { data, error } = await this.client
      .from('question_suggestions')
      .select('id, text')
      .order('display_order', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(error.message ?? 'Failed to fetch question suggestions');
    }

    return (data ?? []).map((row) => ({
      id: row.id as string,
      text: row.text as string,
    }));
  }
}
