import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { FeedbackResult } from '@/domain/models/feedback';

// Supabase クライアントをモック（Route Handler 内で createServerClient を呼ぶため）
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => ({})),
}));

// Repository をモック
vi.mock('@/domain/repositories/feedback.repository');

// Service をモック
vi.mock('@/domain/services/feedback.service');

// FeedbackService のモック実装を制御するための fn
import { FeedbackService } from '@/domain/services/feedback.service';
const mockSubmitFeedback = vi.fn();
vi.mocked(FeedbackService).mockImplementation(() => ({
  submitFeedback: mockSubmitFeedback,
}) as unknown as FeedbackService);

// Route Handler を import（まだ存在しないため、RED 状態になる）
import { POST } from '@/app/api/faqs/[faqId]/feedback/route';

// ------------------------------------------------------------------------------------
// テスト用定数
// ------------------------------------------------------------------------------------
const VALID_FAQ_ID = 'b2c3d4e5-f6a7-4890-b234-123456789012';
const INVALID_FAQ_ID = 'not-a-uuid';

const mockFeedbackResult: FeedbackResult = {
  id: 'f1e2d3c4-b5a6-4890-9234-000000000099',
  faqId: VALID_FAQ_ID,
  value: 'solved',
  submittedAt: '2024-01-15T10:00:00.000Z',
};

// ------------------------------------------------------------------------------------
// テスト用ヘルパー
// ------------------------------------------------------------------------------------
const makePostRequest = (faqId: string, body: unknown) => {
  const url = new URL(`http://localhost/api/faqs/${faqId}/feedback`);
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
};

const buildContext = (faqId: string) => ({
  params: Promise.resolve({ faqId }),
});

// ------------------------------------------------------------------------------------
// テストスイート
// ------------------------------------------------------------------------------------
describe('POST /api/faqs/[faqId]/feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // FeedbackService のモック実装を毎回リセットして再設定
    vi.mocked(FeedbackService).mockImplementation(() => ({
      submitFeedback: mockSubmitFeedback,
    }) as unknown as FeedbackService);
  });

  // ---------------------------------------------------------------------------
  // 1. 正常系: value = "solved" → 201 + { success: true, data: FeedbackResult }
  // ---------------------------------------------------------------------------
  it('should return 201 with FeedbackResult when value is "solved"', async () => {
    // Arrange
    const solvedResult: FeedbackResult = { ...mockFeedbackResult, value: 'solved' };
    mockSubmitFeedback.mockResolvedValue(solvedResult);

    // Act
    const req = makePostRequest(VALID_FAQ_ID, { value: 'solved' });
    const ctx = buildContext(VALID_FAQ_ID);
    const response = await POST(req, ctx);

    // Assert
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: solvedResult,
    });
    expect(mockSubmitFeedback).toHaveBeenCalledWith(VALID_FAQ_ID, 'solved');
  });

  // ---------------------------------------------------------------------------
  // 2. 正常系: value = "unsolved" → 201 + { success: true, data: FeedbackResult }
  // ---------------------------------------------------------------------------
  it('should return 201 with FeedbackResult when value is "unsolved"', async () => {
    // Arrange
    const unsolvedResult: FeedbackResult = { ...mockFeedbackResult, value: 'unsolved' };
    mockSubmitFeedback.mockResolvedValue(unsolvedResult);

    // Act
    const req = makePostRequest(VALID_FAQ_ID, { value: 'unsolved' });
    const ctx = buildContext(VALID_FAQ_ID);
    const response = await POST(req, ctx);

    // Assert
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: unsolvedResult,
    });
    expect(mockSubmitFeedback).toHaveBeenCalledWith(VALID_FAQ_ID, 'unsolved');
  });

  // ---------------------------------------------------------------------------
  // 3. 400 INVALID_FEEDBACK_VALUE: value が "solved" でも "unsolved" でもない
  // ---------------------------------------------------------------------------
  it('should return 400 INVALID_FEEDBACK_VALUE when value is invalid', async () => {
    // Arrange

    // Act
    const req = makePostRequest(VALID_FAQ_ID, { value: 'invalid' });
    const ctx = buildContext(VALID_FAQ_ID);
    const response = await POST(req, ctx);

    // Assert
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({
      success: false,
      error: {
        code: 'INVALID_FEEDBACK_VALUE',
        message: expect.any(String),
      },
    });
    // Service は呼ばれない（バリデーションで弾かれるため）
    expect(mockSubmitFeedback).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // 4. 400 INVALID_FAQ_ID: faqId が UUID 形式でない
  // ---------------------------------------------------------------------------
  it('should return 400 INVALID_FAQ_ID when faqId is not a valid UUID', async () => {
    // Arrange

    // Act
    const req = makePostRequest(INVALID_FAQ_ID, { value: 'solved' });
    const ctx = buildContext(INVALID_FAQ_ID);
    const response = await POST(req, ctx);

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
    expect(mockSubmitFeedback).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // 5. 500 INTERNAL_SERVER_ERROR: Service が例外をスロー
  // ---------------------------------------------------------------------------
  it('should return 500 INTERNAL_SERVER_ERROR when service throws an exception', async () => {
    // Arrange
    mockSubmitFeedback.mockRejectedValue(new Error('DB connection failed'));

    // Act
    const req = makePostRequest(VALID_FAQ_ID, { value: 'solved' });
    const ctx = buildContext(VALID_FAQ_ID);
    const response = await POST(req, ctx);

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
