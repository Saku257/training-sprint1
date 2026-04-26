import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FaqCategory, FaqCategoryListItem } from '@/domain/models/faq-category';

import { FaqCategoryService } from '@/domain/services/faq-category.service';

// ---- プレースホルダー（実装前の RED 用） ----
// Service が存在しないため、ここで型のみ定義して import の代替とする
type FaqCategoryRepositoryMock = {
  findByPropertyId: ReturnType<typeof vi.fn>;
};

// FaqCategoryService のインターフェース（実装後は import に置き換える）
interface IFaqCategoryService {
  getCategoriesByPropertyId(propertyId: string): Promise<FaqCategoryListItem[]>;
}
// -------------------------------------------

describe('FaqCategoryService', () => {
  let mockRepository: FaqCategoryRepositoryMock;
  let service: IFaqCategoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = {
      findByPropertyId: vi.fn(),
    };

    service = new FaqCategoryService(mockRepository as unknown as import('@/domain/repositories/faq-category.repository').FaqCategoryRepository);
  });

  describe('getCategoriesByPropertyId', () => {
    it('should call repository.findByPropertyId with the correct propertyId', async () => {
      // Arrange
      const propertyId = 'property-uuid-001';
      const faqCategories: FaqCategory[] = [
        {
          id: 'cat-1',
          name: 'カテゴリA',
          icon: 'icon-a',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];
      mockRepository.findByPropertyId.mockResolvedValue(faqCategories);

      // Act
      await service.getCategoriesByPropertyId(propertyId);

      // Assert
      expect(mockRepository.findByPropertyId).toHaveBeenCalledWith(propertyId);
    });

    it('should return FaqCategoryListItem[] containing only id, name, and icon (no created_at or updated_at)', async () => {
      // Arrange
      const propertyId = 'property-uuid-002';
      const faqCategories: FaqCategory[] = [
        {
          id: 'cat-1',
          name: 'カテゴリA',
          icon: 'icon-a',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-06-01T00:00:00Z',
        },
        {
          id: 'cat-2',
          name: 'カテゴリB',
          icon: null,
          created_at: '2024-02-01T00:00:00Z',
          updated_at: '2024-07-01T00:00:00Z',
        },
      ];
      mockRepository.findByPropertyId.mockResolvedValue(faqCategories);

      // Act
      const result = await service.getCategoriesByPropertyId(propertyId);

      // Assert: id / name / icon のみが存在する
      expect(result).toHaveLength(2);

      expect(result[0]).toEqual({ id: 'cat-1', name: 'カテゴリA', icon: 'icon-a' });
      expect(result[1]).toEqual({ id: 'cat-2', name: 'カテゴリB', icon: null });

      // created_at, updated_at が含まれていないことを確認
      expect((result[0] as Record<string, unknown>)['created_at']).toBeUndefined();
      expect((result[0] as Record<string, unknown>)['updated_at']).toBeUndefined();
    });

    it('should return empty array when repository returns empty array', async () => {
      // Arrange
      const propertyId = 'property-uuid-003';
      mockRepository.findByPropertyId.mockResolvedValue([]);

      // Act
      const result = await service.getCategoriesByPropertyId(propertyId);

      // Assert
      expect(result).toEqual([]);
    });
  });
});
