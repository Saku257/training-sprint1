import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { FaqPopularItem } from '@/domain/models/faq';

// Supabase クライアントをモック
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => ({})),
}));

// Repository をモック
vi.mock('@/domain/repositories/faq.repository');

// Service をモック
vi.mock('@/domain/services/faq.service');

// FaqService のモック実装を制御するための fn
import { FaqService } from '@/domain/services/faq.service';
const mockGetPopularFaqs = vi.fn<(id: string, limit?: number) => Promise<FaqPopularItem[]>>();
vi.mocked(FaqService).mockImplementation(() => ({
  getPopularFaqs: mockGetPopularFaqs,
}) as unknown as FaqService);

// Route Handler を import（まだ存在しないため、RED 状態になる）
import { GET } from '@/app/api/properties/[propertyId]/faqs/popular/route';

// ------------------------------------------------------------------------------------
// テスト用ヘルパー
// ------------------------------------------------------------------------------------
const createRequest = (propertyId: string, searchParams?: Record<string, string>) => {
  const url = new URL(`http://localhost/api/properties/${propertyId}/faqs/popular`);
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return new NextRequest(url.toString());
};

const buildContext = (propertyId: string) => ({
  params: Promise.resolve({ propertyId }),
});

// ------------------------------------------------------------------------------------
// テストスイート
// ------------------------------------------------------------------------------------
describe('GET /api/properties/[propertyId]/faqs/popular', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // FaqService のモック実装を毎回リセットして再設定
    vi.mocked(FaqService).mockImplementation(() => ({
      getPopularFaqs: mockGetPopularFaqs,
    }) as unknown as FaqService);
  });

  // ---------------------------------------------------------------------------
  // 1. 正常系: 有効な propertyId → 200 + { success: true, data: [...] }
  // ---------------------------------------------------------------------------
  it('should return 200 with popular FAQs when propertyId is valid', async () => {
    // Arrange
    const propertyId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const popularFaqs: FaqPopularItem[] = [
      { id: 'faq-uuid-1', title: 'Wi-Fiのパスワードは？', categoryName: '設備について' },
      { id: 'faq-uuid-2', title: 'チェックアウトは何時ですか？', categoryName: 'チェックアウトについて' },
    ];
    mockGetPopularFaqs.mockResolvedValue(popularFaqs);

    // Act
    const req = createRequest(propertyId);
    const ctx = buildContext(propertyId);
    const response = await GET(req, ctx);

    // Assert
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: popularFaqs,
    });
  });

  // ---------------------------------------------------------------------------
  // 2. クエリパラメータ limit=3 → Service に limit=3 で呼ばれる
  // ---------------------------------------------------------------------------
  it('should call service with limit=3 when query param limit=3 is specified', async () => {
    // Arrange
    const propertyId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    mockGetPopularFaqs.mockResolvedValue([]);

    // Act
    const req = createRequest(propertyId, { limit: '3' });
    const ctx = buildContext(propertyId);
    await GET(req, ctx);

    // Assert: Service が limit=3 で呼ばれること
    expect(mockGetPopularFaqs).toHaveBeenCalledWith(propertyId, 3);
  });

  // ---------------------------------------------------------------------------
  // 3. limit 未指定 → Service に limit=5（デフォルト）で呼ばれる
  // ---------------------------------------------------------------------------
  it('should call service with default limit=5 when limit query param is not specified', async () => {
    // Arrange
    const propertyId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    mockGetPopularFaqs.mockResolvedValue([]);

    // Act: クエリパラメータなし
    const req = createRequest(propertyId);
    const ctx = buildContext(propertyId);
    await GET(req, ctx);

    // Assert: Service がデフォルト limit=5 で呼ばれること
    expect(mockGetPopularFaqs).toHaveBeenCalledWith(propertyId, 5);
  });

  // ---------------------------------------------------------------------------
  // 4. 404: 存在しない propertyId（Service が空配列を返す）→ PROPERTY_NOT_FOUND
  // ---------------------------------------------------------------------------
  it('should return 404 with PROPERTY_NOT_FOUND when propertyId does not exist', async () => {
    // Arrange
    const propertyId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    mockGetPopularFaqs.mockResolvedValue([]);

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
  // 5. 500: Service がエラーをスロー → INTERNAL_SERVER_ERROR
  // ---------------------------------------------------------------------------
  it('should return 500 with INTERNAL_SERVER_ERROR when service throws', async () => {
    // Arrange
    const propertyId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    mockGetPopularFaqs.mockRejectedValue(new Error('Unexpected DB error'));

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
});
