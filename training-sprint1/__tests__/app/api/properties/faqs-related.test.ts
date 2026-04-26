import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { FaqRelatedItem } from '@/domain/models/faq';

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
const mockGetRelatedFaqs = vi.fn();
vi.mocked(FaqService).mockImplementation(() => ({
  getRelatedFaqs: mockGetRelatedFaqs,
}) as unknown as FaqService);

// Route Handler を import（まだ存在しないため、RED 状態になる）
import { GET } from '@/app/api/properties/[propertyId]/faqs/[faqId]/related/route';

// ------------------------------------------------------------------------------------
// テスト用定数
// ------------------------------------------------------------------------------------
const VALID_PROPERTY_ID = 'a1b2c3d4-e5f6-4890-a234-ef1234567890';
const VALID_FAQ_ID = 'b2c3d4e5-f6a7-4890-b234-123456789012';
const INVALID_PROPERTY_ID = 'not-a-uuid';
const INVALID_FAQ_ID = 'also-not-a-uuid';

const mockRelatedFaqs: FaqRelatedItem[] = [
  { id: 'c3d4e5f6-0000-0000-0000-000000000003', title: '暖房の使い方を教えてください' },
  { id: 'd4e5f6a7-0000-0000-0000-000000000004', title: '除湿機の使い方を教えてください' },
  { id: 'e5f6a7b8-0000-0000-0000-000000000005', title: '電気代の目安を教えてください' },
];

// ------------------------------------------------------------------------------------
// テスト用ヘルパー
// ------------------------------------------------------------------------------------
const createRequest = (propertyId: string, faqId: string) => {
  const url = new URL(
    `http://localhost/api/properties/${propertyId}/faqs/${faqId}/related`
  );
  return new NextRequest(url.toString());
};

const buildContext = (propertyId: string, faqId: string) => ({
  params: Promise.resolve({ propertyId, faqId }),
});

// ------------------------------------------------------------------------------------
// テストスイート
// ------------------------------------------------------------------------------------
describe('GET /api/properties/[propertyId]/faqs/[faqId]/related', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // FaqService のモック実装を毎回リセットして再設定
    vi.mocked(FaqService).mockImplementation(() => ({
      getRelatedFaqs: mockGetRelatedFaqs,
    }) as unknown as FaqService);
  });

  // ---------------------------------------------------------------------------
  // 1. 正常系: 関連FAQが存在する場合 → 200 + { success: true, data: FaqRelatedItem[] }
  // ---------------------------------------------------------------------------
  it('should return 200 with related FAQs when service returns items', async () => {
    // Arrange
    mockGetRelatedFaqs.mockResolvedValue(mockRelatedFaqs);

    // Act
    const req = createRequest(VALID_PROPERTY_ID, VALID_FAQ_ID);
    const ctx = buildContext(VALID_PROPERTY_ID, VALID_FAQ_ID);
    const response = await GET(req, ctx);

    // Assert
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: mockRelatedFaqs,
    });
    expect(mockGetRelatedFaqs).toHaveBeenCalledWith(VALID_FAQ_ID);
  });

  // ---------------------------------------------------------------------------
  // 2. 正常系: 関連FAQが0件 → 200 + { success: true, data: [] }（404 にしない）
  // ---------------------------------------------------------------------------
  it('should return 200 with empty array when no related FAQs exist', async () => {
    // Arrange
    mockGetRelatedFaqs.mockResolvedValue([]);

    // Act
    const req = createRequest(VALID_PROPERTY_ID, VALID_FAQ_ID);
    const ctx = buildContext(VALID_PROPERTY_ID, VALID_FAQ_ID);
    const response = await GET(req, ctx);

    // Assert
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: [],
    });
  });

  // ---------------------------------------------------------------------------
  // 3. 400 INVALID_FAQ_ID: faqId が UUID 形式でない
  // ---------------------------------------------------------------------------
  it('should return 400 INVALID_FAQ_ID when faqId is not a valid UUID', async () => {
    // Arrange

    // Act
    const req = createRequest(VALID_PROPERTY_ID, INVALID_FAQ_ID);
    const ctx = buildContext(VALID_PROPERTY_ID, INVALID_FAQ_ID);
    const response = await GET(req, ctx);

    // Assert
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({
      success: false,
      error: {
        code: 'INVALID_FAQ_ID',
        message: expect.any(String),
      },
    });
    // Service は呼ばれない（バリデーションで弾かれるため）
    expect(mockGetRelatedFaqs).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // 4. 500 INTERNAL_SERVER_ERROR: Service が例外をスロー
  // ---------------------------------------------------------------------------
  it('should return 500 INTERNAL_SERVER_ERROR when service throws an exception', async () => {
    // Arrange
    mockGetRelatedFaqs.mockRejectedValue(new Error('DB connection failed'));

    // Act
    const req = createRequest(VALID_PROPERTY_ID, VALID_FAQ_ID);
    const ctx = buildContext(VALID_PROPERTY_ID, VALID_FAQ_ID);
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
