import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { QuestionSuggestionItem } from '@/domain/models/chat';

// Supabase クライアントをモック（Route Handler 内で createServerClient を呼ぶため）
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => ({})),
}));

// Repository をモック
vi.mock('@/domain/repositories/question-suggestion.repository');

// Service をモック
vi.mock('@/domain/services/question-suggestion.service');

// QuestionSuggestionService のモック実装を制御するための fn
import { QuestionSuggestionService } from '@/domain/services/question-suggestion.service';
const mockGetSuggestions = vi.fn();
vi.mocked(QuestionSuggestionService).mockImplementation(() => ({
  getSuggestions: mockGetSuggestions,
}) as unknown as QuestionSuggestionService);

// Route Handler を import（まだ存在しないため、RED 状態になる）
import { GET } from '@/app/api/question-suggestions/route';

// ------------------------------------------------------------------------------------
// テスト用定数
// ------------------------------------------------------------------------------------
const mockSuggestions: QuestionSuggestionItem[] = [
  { id: 'a1b2c3d4-e5f6-4890-a234-ef1234567890', text: 'Wi-Fiのパスワードを教えてください' },
  { id: 'b2c3d4e5-f6a7-4890-b234-123456789012', text: 'チェックアウトの時間を教えてください' },
  { id: 'c3d4e5f6-a7b8-4890-c234-234567890123', text: '近くのコンビニはどこですか' },
];

// ------------------------------------------------------------------------------------
// テストスイート
// ------------------------------------------------------------------------------------
describe('GET /api/question-suggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // QuestionSuggestionService のモック実装を毎回リセットして再設定
    vi.mocked(QuestionSuggestionService).mockImplementation(() => ({
      getSuggestions: mockGetSuggestions,
    }) as unknown as QuestionSuggestionService);
  });

  // ---------------------------------------------------------------------------
  // 1. 正常系: getSuggestions が3件返す → 200 + { success: true, data: items }
  // ---------------------------------------------------------------------------
  it('should return 200 with suggestions list when service returns items', async () => {
    // Arrange
    mockGetSuggestions.mockResolvedValue(mockSuggestions);

    // Act
    const req = new NextRequest(new URL('http://localhost/api/question-suggestions'));
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: mockSuggestions,
    });
    expect(mockGetSuggestions).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // 2. 正常系: getSuggestions が空配列を返す → 200 + { success: true, data: [] }
  // ---------------------------------------------------------------------------
  it('should return 200 with empty array when service returns no items', async () => {
    // Arrange
    mockGetSuggestions.mockResolvedValue([]);

    // Act
    const req = new NextRequest(new URL('http://localhost/api/question-suggestions'));
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: [],
    });
  });

  // ---------------------------------------------------------------------------
  // 3. 500 INTERNAL_SERVER_ERROR: getSuggestions が例外をスロー
  // ---------------------------------------------------------------------------
  it('should return 500 INTERNAL_SERVER_ERROR when service throws an exception', async () => {
    // Arrange
    mockGetSuggestions.mockRejectedValue(new Error('DB connection failed'));

    // Act
    const req = new NextRequest(new URL('http://localhost/api/question-suggestions'));
    const response = await GET(req);

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
