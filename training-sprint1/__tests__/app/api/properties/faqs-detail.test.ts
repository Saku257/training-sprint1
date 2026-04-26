import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { FaqDetailItem } from '@/domain/models/faq';

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
const mockGetFaqDetail = vi.fn();
vi.mocked(FaqService).mockImplementation(() => ({
  getFaqDetail: mockGetFaqDetail,
}) as unknown as FaqService);

// Route Handler を import（まだ存在しないため、RED 状態になる）
import { GET } from '@/app/api/properties/[propertyId]/faqs/[faqId]/route';

// ------------------------------------------------------------------------------------
// テスト用定数
// ------------------------------------------------------------------------------------
const VALID_PROPERTY_ID = 'a1b2c3d4-e5f6-4890-a234-ef1234567890';
const VALID_FAQ_ID = 'b2c3d4e5-f6a7-4890-b234-123456789012';
const INVALID_PROPERTY_ID = 'not-a-uuid';
const INVALID_FAQ_ID = 'also-not-a-uuid';

const mockFaqDetail: FaqDetailItem = {
  id: VALID_FAQ_ID,
  title: 'エアコンの使い方を教えてください',
  body: 'エアコンのリモコンは棚の上にあります。冷房は20度〜28度で設定してください。',
  categoryName: '設備',
  updatedAt: '2024-01-15T10:00:00.000Z',
  supportDesk: {
    phone: '03-1234-5678',
    formUrl: 'https://example.com/support',
  },
};

// ------------------------------------------------------------------------------------
// テスト用ヘルパー
// ------------------------------------------------------------------------------------
const createRequest = (propertyId: string, faqId: string) => {
  const url = new URL(
    `http://localhost/api/properties/${propertyId}/faqs/${faqId}`
  );
  return new NextRequest(url.toString());
};

const buildContext = (propertyId: string, faqId: string) => ({
  params: Promise.resolve({ propertyId, faqId }),
});

// ------------------------------------------------------------------------------------
// テストスイート
// ------------------------------------------------------------------------------------
describe('GET /api/properties/[propertyId]/faqs/[faqId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // FaqService のモック実装を毎回リセットして再設定
    vi.mocked(FaqService).mockImplementation(() => ({
      getFaqDetail: mockGetFaqDetail,
    }) as unknown as FaqService);
  });

  // ---------------------------------------------------------------------------
  // 1. 正常系: Service が FaqDetailItem を返す → 200 + { success: true, data: FaqDetailItem }
  // ---------------------------------------------------------------------------
  it('should return 200 with FAQ detail when service returns a FaqDetailItem', async () => {
    // Arrange
    mockGetFaqDetail.mockResolvedValue(mockFaqDetail);

    // Act
    const req = createRequest(VALID_PROPERTY_ID, VALID_FAQ_ID);
    const ctx = buildContext(VALID_PROPERTY_ID, VALID_FAQ_ID);
    const response = await GET(req, ctx);

    // Assert
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: mockFaqDetail,
    });
    expect(mockGetFaqDetail).toHaveBeenCalledWith(VALID_PROPERTY_ID, VALID_FAQ_ID);
  });

  // ---------------------------------------------------------------------------
  // 2. 404 FAQ_NOT_FOUND: Service が null を返す
  // ---------------------------------------------------------------------------
  it('should return 404 FAQ_NOT_FOUND when service returns null', async () => {
    // Arrange
    mockGetFaqDetail.mockResolvedValue(null);

    // Act
    const req = createRequest(VALID_PROPERTY_ID, VALID_FAQ_ID);
    const ctx = buildContext(VALID_PROPERTY_ID, VALID_FAQ_ID);
    const response = await GET(req, ctx);

    // Assert
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toEqual({
      success: false,
      error: {
        code: 'FAQ_NOT_FOUND',
        message: expect.any(String),
      },
    });
    // Service は呼ばれる（DBに問い合わせてnullが返った）
    expect(mockGetFaqDetail).toHaveBeenCalledWith(VALID_PROPERTY_ID, VALID_FAQ_ID);
  });

  // ---------------------------------------------------------------------------
  // 3. 400 INVALID_PROPERTY_ID: propertyId が UUID 形式でない
  // ---------------------------------------------------------------------------
  it('should return 400 INVALID_PROPERTY_ID when propertyId is not a valid UUID', async () => {
    // Arrange

    // Act
    const req = createRequest(INVALID_PROPERTY_ID, VALID_FAQ_ID);
    const ctx = buildContext(INVALID_PROPERTY_ID, VALID_FAQ_ID);
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
    expect(mockGetFaqDetail).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // 4. 400 INVALID_FAQ_ID: faqId が UUID 形式でない
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
    expect(mockGetFaqDetail).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // 5. 500 INTERNAL_SERVER_ERROR: Service が例外をスロー
  // ---------------------------------------------------------------------------
  it('should return 500 INTERNAL_SERVER_ERROR when service throws an exception', async () => {
    // Arrange
    mockGetFaqDetail.mockRejectedValue(new Error('DB connection failed'));

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
