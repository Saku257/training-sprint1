import { SupabaseClient } from '@supabase/supabase-js';
import type { FaqCategory } from '@/domain/models/faq-category';

export class FaqCategoryRepository {
  constructor(private client: SupabaseClient) {}

  async findByPropertyId(propertyId: string): Promise<FaqCategory[]> {
    // faqs テーブルから property_id に紐づく category_id を取得
    const { data: faqData, error: faqError } = await this.client
      .from('faqs')
      .select('category_id')
      .eq('property_id', propertyId)
      .eq('is_published', true);

    if (faqError || !faqData || faqData.length === 0) {
      return [];
    }

    // distinct な category_id を抽出
    const categoryIds = [...new Set(faqData.map((f: { category_id: string }) => f.category_id))];

    if (categoryIds.length === 0) {
      return [];
    }

    // faq_categories テーブルから該当カテゴリを取得
    const { data, error } = await this.client
      .from('faq_categories')
      .select('id, name, icon, created_at, updated_at')
      .in('id', categoryIds);

    if (error || !data) {
      return [];
    }

    return data as FaqCategory[];
  }
}
