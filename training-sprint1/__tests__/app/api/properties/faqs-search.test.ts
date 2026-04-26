import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { FaqSearchResultItem } from '@/domain/models/faq';

// Supabase クライアントをモック（Route Handler 内で createServerClient を呼ぶため）
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => ({})),
}));

// Repository をモック
vi.mock('@/domain/repositories/faq.repository');

// Service をモック
vi.mock('@/domain/services/faq.service');

// FaqService のモック実装を制御するための fn
import { FaqService } from '@/domain/services/faq.service';
const mockSearchFaqs = vi.fn<
  (
    propertyId: string,
    query: { q?: string; categoryId?: string }
  ) => Promise<{ total: number; items: FaqSearchResultItem[] }>
>();
vi.mocked(FaqService).mockImplementation(() => ({
  searchFaqs: mockSearchFaqs,
}) as unknown as FaqService);

// Route Handler を import（まだ存在しないため、RED 状態になる）
import { GET } from '@/app/api/properties/[propertyId]/faqs/search/route';

// ------------------------------------------------------------------------------------
// テスト用定数
// ------------------------------------------------------------------------------------
const VALID_PROPERTY_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const VALID_CATEGORY_ID = 'c1c2c3c4-d5d6-7890-abcd-ef1234567890';
const INVALID_PROPERTY_ID = 'not-a-uuid';

const mockFaqItems: FaqSearchResultItem[] = [
  {
    id: 'faq-uuid-001',
    title: 'エアコンの使い方を教えてください',
    bodyExcerpt: 'エアコンのリモコンは...',
    categoryName: '設備',
  },
  {
    id: 'faq-uuid-002',
    title: 'Wi-Fiのパスワードは？',
    bodyExcerpt: 'Wi-Fiのネットワーク名は...',
    categoryName: '設備',
  },
];

// ------------------------------------------------------------------------------------
// テスト用ヘルパー
// ------------------------------------------------------------------------------------
const createRequest = (
  propertyId: string,
  searchParams?: Record<string, string>
) => {
  const url = new URL(
    `http://localhost/api/properties/${propertyId}/faqs/search`
  );
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
describe('GET /api/properties/[propertyId]/faqs/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // FaqService のモック実装を毎回リセットして再設定
    vi.mocked(FaqService).mockImplementation(() => ({
      searchFaqs: mockSearchFaqs,
    }) as unknown as FaqService);
  });

  // ---------------------------------------------------------------------------
  // 1. 正常系: q のみ指定 → 200 + { success: true, data: { total, items } }
  // ---------------------------------------------------------------------------
  it('should return 200 with search results when only q is specified', async () => {
    // Arrange
    mockSearchFaqs.mockResolvedValue({ total: 2, items: mockFaqItems });

    // Act
    const req = createRequest(VALID_PROPERTY_ID, { q: 'エアコン' });
    const ctx = buildContext(VALID_PROPERTY_ID);
    const response = await GET(req, ctx);

    // Assert
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: {
        total: 2,
        items: mockFaqItems,
      },
    });
    expect(mockSearchFaqs).toHaveBeenCalledWith(VALID_PROPERTY_ID, { q: 'エアコン' });
  });

  // ---------------------------------------------------------------------------
  // 2. 正常系: categoryId のみ指定 → 200 + { success: true, data: { total, items } }
  // ---------------------------------------------------------------------------
  it('should return 200 with search results when only categoryId is specified', async () => {
    // Arrange
    mockSearchFaqs.mockResolvedValue({ total: 2, items: mockFaqItems });

    // Act
    const req = createRequest(VALID_PROPERTY_ID, { categoryId: VALID_CATEGORY_ID });
    const ctx = buildContext(VALID_PROPERTY_ID);
    const response = await GET(req, ctx);

    // Assert
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: {
        total: 2,
        items: mockFaqItems,
      },
    });
    expect(mockSearchFaqs).toHaveBeenCalledWith(VALID_PROPERTY_ID, {
      categoryId: VALID_CATEGORY_ID,
    });
  });

  // ---------------------------------------------------------------------------
  // 3. 正常系: q と categoryId の両方指定 → 200 で返す（Service は q のみで呼ばれる）
  // ---------------------------------------------------------------------------
  it('should return 200 and call service with q only when both q and categoryId are specified', async () => {
    // Arrange
    mockSearchFaqs.mockResolvedValue({ total: 1, items: [mockFaqItems[0]] });

    // Act
    const req = createRequest(VALID_PROPERTY_ID, {
      q: 'エアコン',
      categoryId: VALID_CATEGORY_ID,
    });
    const ctx = buildContext(VALID_PROPERTY_ID);
    const response = await GET(req, ctx);

    // Assert
    expect(response.status).toBe(200);
    // q が指定されている場合、Service には q のみを渡す（q 優先）
    expect(mockSearchFaqs).toHaveBeenCalledWith(VALID_PROPERTY_ID, { q: 'エアコン' });
  });

  // ---------------------------------------------------------------------------
  // 4. 正常系: 検索結果が0件 → { success: true, data: { total: 0, items: [] } }
  // ---------------------------------------------------------------------------
  it('should return 200 with empty items when no FAQ matches the search', async () => {
    // Arrange
    mockSearchFaqs.mockResolvedValue({ total: 0, items: [] });

    // Act
    const req = createRequest(VALID_PROPERTY_ID, { q: '存在しないキーワード' });
    const ctx = buildContext(VALID_PROPERTY_ID);
    const response = await GET(req, ctx);

    // Assert
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: {
        total: 0,
        items: [],
      },
    });
  });

  // ---------------------------------------------------------------------------
  // 5. 400 INVALID_SEARCH_QUERY: q も categoryId もなし
  // ---------------------------------------------------------------------------
  it('should return 400 INVALID_SEARCH_QUERY when neither q nor categoryId is provided', async () => {
    // Arrange: クエリパラメータなし

    // Act
    const req = createRequest(VALID_PROPERTY_ID);
    const ctx = buildContext(VALID_PROPERTY_ID);
    const response = await GET(req, ctx);

    // Assert
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({
      success: false,
      error: {
        code: 'INVALID_SEARCH_QUERY',
        message: expect.any(String),
      },
    });
    // Service は呼ばれない（バリデーションで弾かれるため）
    expect(mockSearchFaqs).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // 6. 400 INVALID_SEARCH_QUERY: q が空白のみ（例: "   "）
  // ---------------------------------------------------------------------------
  it('should return 400 INVALID_SEARCH_QUERY when q is whitespace only', async () => {
    // Arrange

    // Act
    const req = createRequest(VALID_PROPERTY_ID, { q: '   ' });
    const ctx = buildContext(VALID_PROPERTY_ID);
    const response = await GET(req, ctx);

    // Assert
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({
      success: false,
      error: {
        code: 'INVALID_SEARCH_QUERY',
        message: expect.any(String),
      },
    });
    expect(mockSearchFaqs).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // 7. 400 INVALID_SEARCH_QUERY: q が51文字超過
  // ---------------------------------------------------------------------------
  it('should return 400 INVALID_SEARCH_QUERY when q exceeds 50 characters', async () => {
    // Arrange: 51文字の q
    const longQuery = 'あ'.repeat(51);

    // Act
    const req = createRequest(VALID_PROPERTY_ID, { q: longQuery });
    const ctx = buildContext(VALID_PROPERTY_ID);
    const response = await GET(req, ctx);

    // Assert
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({
      success: false,
      error: {
        code: 'INVALID_SEARCH_QUERY',
        message: expect.any(String),
      },
    });
    expect(mockSearchFaqs).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // 8. 400 INVALID_PROPERTY_ID: propertyId が UUID 形式でない
  // ---------------------------------------------------------------------------
  it('should return 400 INVALID_PROPERTY_ID when propertyId is not a valid UUID', async () => {
    // Arrange

    // Act
    const req = createRequest(INVALID_PROPERTY_ID, { q: 'エアコン' });
    const ctx = buildContext(INVALID_PROPERTY_ID);
    const response = await GET(req, ctx);

    // Assert
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({
      success: false,
      error: {
        code: 'INVALID_PROPERTY_ID',
        message: expect.any(String),
      },
    });
    // Service は呼ばれない（バリデーションで弾かれるため）
    expect(mockSearchFaqs).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // 9. 500 INTERNAL_SERVER_ERROR: Service が例外をスロー
  // ---------------------------------------------------------------------------
  it('should return 500 INTERNAL_SERVER_ERROR when service throws an exception', async () => {
    // Arrange
    mockSearchFaqs.mockRejectedValue(new Error('DB connection failed'));

    // Act
    const req = createRequest(VALID_PROPERTY_ID, { q: 'エアコン' });
    const ctx = buildContext(VALID_PROPERTY_ID);
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
