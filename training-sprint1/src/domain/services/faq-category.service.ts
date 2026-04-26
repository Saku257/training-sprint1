import type { FaqCategoryRepository } from '@/domain/repositories/faq-category.repository';
import type { FaqCategoryListItem } from '@/domain/models/faq-category';

export class FaqCategoryService {
  constructor(private repository: FaqCategoryRepository) {}

  async getCategoriesByPropertyId(propertyId: string): Promise<FaqCategoryListItem[]> {
    const categories = await this.repository.findByPropertyId(propertyId);
    return categories.map(({ id, name, icon }) => ({ id, name, icon }));
  }
}
