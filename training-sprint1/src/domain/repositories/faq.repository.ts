import { SupabaseClient } from '@supabase/supabase-js';
import type {
  FaqPopularItem,
  FaqSearchResultItem,
  FaqDetailItem,
  FaqRelatedItem,
} from '@/domain/models/faq';

export class FaqRepository {
  constructor(private client: SupabaseClient) {}

  async findPopularByPropertyId(propertyId: string, limit: number): Promise<FaqPopularItem[]> {
    const { data, error } = await this.client
      .from('faqs')
      .select('id, title, faq_categories(name)')
      .eq('property_id', propertyId)
      .eq('is_published', true)
      .order('access_count', { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data.map((item: Record<string, unknown>) => ({
      id: item.id as string,
      title: item.title as string,
      categoryName: (item.faq_categories as { name: string } | null)?.name ?? '',
    }));
  }

  async searchByPropertyId(
    propertyId: string,
    query: { q?: string; categoryId?: string; limit?: number }
  ): Promise<FaqSearchResultItem[]> {
    const { q, categoryId, limit } = query;

    let builder = this.client
      .from('faqs')
      .select('id, title, body, faq_categories(name)')
      .eq('property_id', propertyId)
      .eq('is_published', true);

    if (q) {
      builder = builder.or(`title.ilike.%${q}%,body.ilike.%${q}%`);
    } else if (categoryId) {
      builder = builder.eq('category_id', categoryId);
    }

    if (limit !== undefined) {
      builder = builder.limit(limit);
    }

    const { data, error } = await builder;

    if (error || !data) {
      return [];
    }

    return data.map((item: Record<string, unknown>) => ({
      id: item.id as string,
      title: item.title as string,
      bodyExcerpt: (item.body as string).substring(0, 100),
      categoryName: (item.faq_categories as { name: string } | null)?.name ?? '',
    }));
  }

  async findDetailByPropertyAndId(
    propertyId: string,
    faqId: string
  ): Promise<FaqDetailItem | null> {
    const { data, error } = await this.client
      .from('faqs')
      .select(
        'id, title, body, updated_at, faq_categories(name), properties(support_phone, support_form_url)'
      )
      .eq('id', faqId)
      .eq('property_id', propertyId)
      .eq('is_published', true)
      .single();

    if (error || !data) {
      return null;
    }

    const item = data as Record<string, unknown>;

    // access_count を +1 する
    const { data: currentFaq } = await this.client
      .from('faqs')
      .select('access_count')
      .eq('id', faqId)
      .single();

    if (currentFaq) {
      await this.client
        .from('faqs')
        .update({ access_count: (currentFaq as { access_count: number }).access_count + 1 })
        .eq('id', faqId);
    }

    return {
      id: item.id as string,
      title: item.title as string,
      body: item.body as string,
      categoryName: (item.faq_categories as { name: string } | null)?.name ?? '',
      updatedAt: item.updated_at as string,
      supportDesk: {
        phone:
          (item.properties as { support_phone: string; support_form_url: string | null } | null)
            ?.support_phone ?? '',
        formUrl:
          (item.properties as { support_phone: string; support_form_url: string | null } | null)
            ?.support_form_url ?? null,
      },
    };
  }

  async findRelatedByFaqId(faqId: string, limit: number): Promise<FaqRelatedItem[]> {
    // Step 1: 対象FAQのタグID一覧を取得
    const { data: tagMappings } = await this.client
      .from('faq_tag_mappings')
      .select('tag_id')
      .eq('faq_id', faqId);

    if (!tagMappings || tagMappings.length === 0) return [];
    const tagIds = tagMappings.map((m: { tag_id: string }) => m.tag_id);

    // Step 2: 同タグを持つ他のFAQのID一覧を取得（自身を除外）
    const { data: relatedMappings } = await this.client
      .from('faq_tag_mappings')
      .select('faq_id')
      .in('tag_id', tagIds)
      .neq('faq_id', faqId);

    if (!relatedMappings || relatedMappings.length === 0) return [];
    const relatedFaqIds = [
      ...new Set(relatedMappings.map((m: { faq_id: string }) => m.faq_id)),
    ].slice(0, limit);

    // Step 3: FAQの id と title を取得
    const { data: faqs } = await this.client
      .from('faqs')
      .select('id, title')
      .in('id', relatedFaqIds)
      .eq('is_published', true);

    return (faqs ?? []).map((f: { id: string; title: string }) => ({ id: f.id, title: f.title }));
  }
}
