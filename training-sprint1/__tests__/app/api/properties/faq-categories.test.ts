import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { FaqCategoryListItem } from '@/domain/models/faq-category';

// Supabase クライアントをモック（Route Handler 内で createServerClient を呼ぶため）
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => ({})),
}));

// Repository をモック
vi.mock('@/domain/repositories/faq-category.repository');

// Service をモック
vi.mock('@/domain/services/faq-category.service');

// FaqCategoryService のモック実装を制御するための fn
import { FaqCategoryService } from '@/domain/services/faq-category.service';
const mockGetCategoriesByPropertyId = vi.fn<(id: string) => Promise<FaqCategoryListItem[]>>();
vi.mocked(FaqCategoryService).mockImplementation(() => ({
  getCategoriesByPropertyId: mockGetCategoriesByPropertyId,
}) as unknown as FaqCategoryService);

// Route Handler を import（まだ存在しないため、RED 状態になる）
import { GET } from '@/app/api/properties/[propertyId]/faq-categories/route';

// ------------------------------------------------------------------------------------
// テスト用ヘルパー
// ------------------------------------------------------------------------------------
const createRequest = (propertyId: string) =>
  new NextRequest(`http://localhost/api/properties/${propertyId}/faq-categories`);

const buildContext = (propertyId: string) => ({
  params: Promise.resolve({ propertyId }),
});

// ------------------------------------------------------------------------------------
// テストスイート
// ------------------------------------------------------------------------------------
describe('GET /api/properties/[propertyId]/faq-categories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // FaqCategoryService のモック実装を毎回リセットして再設定
    vi.mocked(FaqCategoryService).mockImplementation(() => ({
      getCategoriesByPropertyId: mockGetCategoriesByPropertyId,
    }) as unknown as FaqCategoryService);
  });

  // ---------------------------------------------------------------------------
  // 1. 正常系: 有効な propertyId → 200 + { success: true, data: [...] }
  // ---------------------------------------------------------------------------
  it('should return 200 with categories when propertyId is valid', async () => {
    // Arrange
    const propertyId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const categories: FaqCategoryListItem[] = [
      { id: 'cat-uuid-1', name: '設備について', icon: 'wrench' },
      { id: 'cat-uuid-2', name: 'チェックインについて', icon: 'door' },
    ];
    mockGetCategoriesByPropertyId.mockResolvedValue(categories);

    // Act
    const req = createRequest(propertyId);
    const ctx = buildContext(propertyId);
    const response = await GET(req, ctx);

    // Assert
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: categories,
    });
  });

  // ---------------------------------------------------------------------------
  // 2. 404: 存在しない propertyId（Service が空配列を返す）→ PROPERTY_NOT_FOUND
  // ---------------------------------------------------------------------------
  it('should return 404 with PROPERTY_NOT_FOUND when propertyId does not exist', async () => {
    // Arrange: Service は空配列を返す（プロパティに紐づくカテゴリが 0 件）
    const propertyId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    mockGetCategoriesByPropertyId.mockResolvedValue([]);

    // Act
    const req = createRequest(propertyId);
    const ctx = buildContext(propertyId);
    const response = await GET(req, ctx);

    // Assert
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toEqual({
      success: false,
      error: {
        code: 'PROPERTY_NOT_FOUND',
        message: expect.any(String),
      },
    });
  });

  // ---------------------------------------------------------------------------
  // 3. 500: Service がエラーをスロー → INTERNAL_SERVER_ERROR
  // ---------------------------------------------------------------------------
  it('should return 500 with INTERNAL_SERVER_ERROR when service throws', async () => {
    // Arrange
    const propertyId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    mockGetCategoriesByPropertyId.mockRejectedValue(new Error('DB connection failed'));

    // Act
    const req = createRequest(propertyId);
    const ctx = buildContext(propertyId);
    const response = await GET(req, ctx);

    // Assert
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: expect.any(String),
      },
    });
  });

  // ---------------------------------------------------------------------------
  // 4. 400: propertyId が UUID 形式でない → バリデーションエラー
  // ---------------------------------------------------------------------------
  it('should return 400 when propertyId is not a valid UUID', async () => {
    // Arrange
    const propertyId = 'not-a-valid-uuid';

    // Act
    const req = createRequest(propertyId);
    const ctx = buildContext(propertyId);
    const response = await GET(req, ctx);

    // Assert
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBeDefined();
    // Service は呼ばれない（バリデーションで弾かれるため）
    expect(mockGetCategoriesByPropertyId).not.toHaveBeenCalled();
  });
});
