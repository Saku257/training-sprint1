import type { FaqRepository } from '@/domain/repositories/faq.repository';
import type {
  FaqPopularItem,
  FaqSearchResultItem,
  FaqDetailItem,
  FaqRelatedItem,
} from '@/domain/models/faq';

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 10;

export class FaqService {
  constructor(private repository: FaqRepository) {}

  async getPopularFaqs(propertyId: string, limit?: number): Promise<FaqPopularItem[]> {
    const resolvedLimit = Math.min(limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    return this.repository.findPopularByPropertyId(propertyId, resolvedLimit);
  }

  async searchFaqs(
    propertyId: string,
    query: { q?: string; categoryId?: string }
  ): Promise<{ total: number; items: FaqSearchResultItem[] }> {
    // q が指定された場合は q のみを渡す（q 優先）
    const repositoryQuery = query.q ? { q: query.q } : { categoryId: query.categoryId };

    const items = await this.repository.searchByPropertyId(propertyId, repositoryQuery);
    return { total: items.length, items };
  }

  async getFaqDetail(propertyId: string, faqId: string): Promise<FaqDetailItem | null> {
    return this.repository.findDetailByPropertyAndId(propertyId, faqId);
  }

  async getRelatedFaqs(faqId: string, limit?: number): Promise<FaqRelatedItem[]> {
    const MAX_RELATED = 5;
    const DEFAULT_RELATED = 3;
    const resolvedLimit = Math.min(limit ?? DEFAULT_RELATED, MAX_RELATED);
    return this.repository.findRelatedByFaqId(faqId, resolvedLimit);
  }
}
