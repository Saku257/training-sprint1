import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FaqPopularItem, FaqSearchResultItem, FaqDetailItem, FaqRelatedItem } from '@/domain/models/faq';

import { FaqService } from '@/domain/services/faq.service';

// ---- プレースホルダー（実装前の RED 用） ----
type FaqRepositoryMock = {
  findPopularByPropertyId: ReturnType<typeof vi.fn>;
  searchByPropertyId: ReturnType<typeof vi.fn>;
  findDetailByPropertyAndId: ReturnType<typeof vi.fn>;
  findRelatedByFaqId: ReturnType<typeof vi.fn>;
};

// FaqService のインターフェース（実装後は import に置き換える）
interface IFaqService {
  getPopularFaqs(propertyId: string, limit?: number): Promise<FaqPopularItem[]>;
  searchFaqs(
    propertyId: string,
    query: { q?: string; categoryId?: string }
  ): Promise<{ total: number; items: FaqSearchResultItem[] }>;
  getFaqDetail(propertyId: string, faqId: string): Promise<FaqDetailItem | null>;
  getRelatedFaqs(faqId: string, limit?: number): Promise<FaqRelatedItem[]>;
}
// -------------------------------------------

describe('FaqService', () => {
  let mockRepository: FaqRepositoryMock;
  let service: IFaqService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = {
      findPopularByPropertyId: vi.fn(),
      searchByPropertyId: vi.fn(),
      findDetailByPropertyAndId: vi.fn(),
      findRelatedByFaqId: vi.fn(),
    };

    service = new FaqService(mockRepository as unknown as import('@/domain/repositories/faq.repository').FaqRepository);
  });

  describe('getPopularFaqs', () => {
    it('should call repository.findPopularByPropertyId with default limit=5 when limit is not specified', async () => {
      // Arrange
      const propertyId = 'property-uuid-001';
      mockRepository.findPopularByPropertyId.mockResolvedValue([]);

      // Act
      await service.getPopularFaqs(propertyId);

      // Assert: デフォルト limit=5 で repository が呼ばれる
      expect(mockRepository.findPopularByPropertyId).toHaveBeenCalledWith(propertyId, 5);
    });

    it('should call repository.findPopularByPropertyId with specified limit=3', async () => {
      // Arrange
      const propertyId = 'property-uuid-002';
      mockRepository.findPopularByPropertyId.mockResolvedValue([]);

      // Act
      await service.getPopularFaqs(propertyId, 3);

      // Assert: 指定 limit=3 で repository が呼ばれる
      expect(mockRepository.findPopularByPropertyId).toHaveBeenCalledWith(propertyId, 3);
    });

    it('should clamp limit to 10 when specified limit exceeds 10', async () => {
      // Arrange
      const propertyId = 'property-uuid-003';
      mockRepository.findPopularByPropertyId.mockResolvedValue([]);

      // Act: limit=15 を渡す
      await service.getPopularFaqs(propertyId, 15);

      // Assert: 10 に切り詰めて repository が呼ばれる
      expect(mockRepository.findPopularByPropertyId).toHaveBeenCalledWith(propertyId, 10);
    });

    it('should return the result from repository as-is', async () => {
      // Arrange
      const propertyId = 'property-uuid-004';
      const popularFaqs: FaqPopularItem[] = [
        { id: 'faq-1', title: 'よくある質問1', categoryName: 'カテゴリA' },
        { id: 'faq-2', title: 'よくある質問2', categoryName: 'カテゴリB' },
      ];
      mockRepository.findPopularByPropertyId.mockResolvedValue(popularFaqs);

      // Act
      const result = await service.getPopularFaqs(propertyId);

      // Assert: repository の返り値をそのまま返す
      expect(result).toEqual(popularFaqs);
    });

    it('should return empty array when repository returns empty array', async () => {
      // Arrange
      const propertyId = 'property-uuid-005';
      mockRepository.findPopularByPropertyId.mockResolvedValue([]);

      // Act
      const result = await service.getPopularFaqs(propertyId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('searchFaqs', () => {
    it('should call repository.searchByPropertyId with { q } when only q is specified', async () => {
      // Arrange
      const propertyId = 'property-uuid-010';
      const query = 'チェックアウト';
      mockRepository.searchByPropertyId.mockResolvedValue([]);

      // Act
      await service.searchFaqs(propertyId, { q: query });

      // Assert: q のみで repository が呼ばれる
      expect(mockRepository.searchByPropertyId).toHaveBeenCalledWith(propertyId, { q: query });
    });

    it('should call repository.searchByPropertyId with { categoryId } when only categoryId is specified', async () => {
      // Arrange
      const propertyId = 'property-uuid-011';
      const categoryId = 'category-uuid-001';
      mockRepository.searchByPropertyId.mockResolvedValue([]);

      // Act
      await service.searchFaqs(propertyId, { categoryId });

      // Assert: categoryId のみで repository が呼ばれる
      expect(mockRepository.searchByPropertyId).toHaveBeenCalledWith(propertyId, { categoryId });
    });

    it('should call repository.searchByPropertyId with { q } only when both q and categoryId are specified (q takes priority)', async () => {
      // Arrange
      const propertyId = 'property-uuid-012';
      const q = 'チェックアウト';
      const categoryId = 'category-uuid-001';
      mockRepository.searchByPropertyId.mockResolvedValue([]);

      // Act
      await service.searchFaqs(propertyId, { q, categoryId });

      // Assert: q のみが渡される（categoryId は無視）
      expect(mockRepository.searchByPropertyId).toHaveBeenCalledWith(propertyId, { q });
    });

    it('should return { total: items.length, items } with the repository result', async () => {
      // Arrange
      const propertyId = 'property-uuid-013';
      const items: FaqSearchResultItem[] = [
        { id: 'faq-1', title: 'チェックアウト手順', bodyExcerpt: 'チェックアウトは11時までにお願いします。', categoryName: '宿泊' },
        { id: 'faq-2', title: 'チェックアウト後の荷物', bodyExcerpt: 'チェックアウト後も荷物はフロントに預けられます。', categoryName: '宿泊' },
      ];
      mockRepository.searchByPropertyId.mockResolvedValue(items);

      // Act
      const result = await service.searchFaqs(propertyId, { q: 'チェックアウト' });

      // Assert: { total: 2, items } の形式で返る
      expect(result).toEqual({ total: 2, items });
    });

    it('should return { total: 0, items: [] } when repository returns empty array', async () => {
      // Arrange
      const propertyId = 'property-uuid-014';
      mockRepository.searchByPropertyId.mockResolvedValue([]);

      // Act
      const result = await service.searchFaqs(propertyId, { q: '存在しないキーワード' });

      // Assert
      expect(result).toEqual({ total: 0, items: [] });
    });
  });

  describe('getFaqDetail', () => {
    it('should call repository.findDetailByPropertyAndId with propertyId and faqId', async () => {
      // Arrange
      const propertyId = 'property-uuid-020';
      const faqId = 'faq-uuid-001';
      mockRepository.findDetailByPropertyAndId.mockResolvedValue(null);

      // Act
      await service.getFaqDetail(propertyId, faqId);

      // Assert: 正しい引数で repository が呼ばれる
      expect(mockRepository.findDetailByPropertyAndId).toHaveBeenCalledWith(propertyId, faqId);
    });

    it('should return FaqDetailItem when FAQ exists', async () => {
      // Arrange
      const propertyId = 'property-uuid-021';
      const faqId = 'faq-uuid-002';
      const detailItem: FaqDetailItem = {
        id: faqId,
        title: 'チェックアウト手順',
        body: 'チェックアウトは11時までにお願いします。',
        categoryName: '宿泊',
        updatedAt: '2024-01-01T00:00:00Z',
        supportDesk: {
          phone: '03-1234-5678',
          formUrl: 'https://example.com/form',
        },
      };
      mockRepository.findDetailByPropertyAndId.mockResolvedValue(detailItem);

      // Act
      const result = await service.getFaqDetail(propertyId, faqId);

      // Assert: repository の返り値をそのまま返す
      expect(result).toEqual(detailItem);
    });

    it('should return null when FAQ does not exist', async () => {
      // Arrange
      const propertyId = 'property-uuid-022';
      const faqId = 'non-existent-faq-id';
      mockRepository.findDetailByPropertyAndId.mockResolvedValue(null);

      // Act
      const result = await service.getFaqDetail(propertyId, faqId);

      // Assert: null をそのまま返す
      expect(result).toBeNull();
    });
  });

  describe('getRelatedFaqs', () => {
    it('should call repository.findRelatedByFaqId with faqId and limit', async () => {
      // Arrange
      const faqId = 'faq-uuid-030';
      mockRepository.findRelatedByFaqId.mockResolvedValue([]);

      // Act
      await service.getRelatedFaqs(faqId, 3);

      // Assert: 指定した引数で repository が呼ばれる
      expect(mockRepository.findRelatedByFaqId).toHaveBeenCalledWith(faqId, 3);
    });

    it('should use default limit=3 when limit is not specified', async () => {
      // Arrange
      const faqId = 'faq-uuid-031';
      mockRepository.findRelatedByFaqId.mockResolvedValue([]);

      // Act: limit を指定しない
      await service.getRelatedFaqs(faqId);

      // Assert: デフォルト limit=3 で repository が呼ばれる
      expect(mockRepository.findRelatedByFaqId).toHaveBeenCalledWith(faqId, 3);
    });

    it('should clamp limit to 5 when specified limit exceeds 5', async () => {
      // Arrange
      const faqId = 'faq-uuid-032';
      mockRepository.findRelatedByFaqId.mockResolvedValue([]);

      // Act: limit=10 を渡す
      await service.getRelatedFaqs(faqId, 10);

      // Assert: 5 に切り詰めて repository が呼ばれる
      expect(mockRepository.findRelatedByFaqId).toHaveBeenCalledWith(faqId, 5);
    });
  });
});
