import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { ChatSessionResult } from '@/domain/models/chat';

// Supabase クライアントをモック
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => ({})),
}));

// LLM をモック
vi.mock('@/app/lib/llm/chat', () => ({ generateAiAnswer: vi.fn() }));

// Repository をモック
vi.mock('@/domain/repositories/chat-session.repository');
vi.mock('@/domain/repositories/chat-message.repository');
vi.mock('@/domain/repositories/faq.repository');

// Service をモック
vi.mock('@/domain/services/chat.service');

// ChatService のモック実装を制御するための fn
import { ChatService } from '@/domain/services/chat.service';
const mockCreateSession = vi.fn();
vi.mocked(ChatService).mockImplementation(() => ({
  createSession: mockCreateSession,
  sendMessage: vi.fn(),
}) as unknown as ChatService);

// Route Handler を import（まだ存在しないため、RED 状態になる）
import { POST } from '@/app/api/chat/sessions/route';

// ------------------------------------------------------------------------------------
// テスト用定数
// ------------------------------------------------------------------------------------
const VALID_PROPERTY_ID = 'a1b2c3d4-e5f6-4890-a234-ef1234567890';
const INVALID_PROPERTY_ID = 'not-a-uuid';

const mockSessionResult: ChatSessionResult = {
  sessionId: 'c3d4e5f6-a7b8-4890-c234-234567890123',
  startedAt: '2024-06-01T10:00:00.000Z',
};

// ------------------------------------------------------------------------------------
// テスト用ヘルパー
// ------------------------------------------------------------------------------------
const makePostRequest = (body: unknown) => {
  const url = new URL('http://localhost/api/chat/sessions');
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
};

// ------------------------------------------------------------------------------------
// テストスイート
// ------------------------------------------------------------------------------------
describe('POST /api/chat/sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ChatService).mockImplementation(() => ({
      createSession: mockCreateSession,
      sendMessage: vi.fn(),
    }) as unknown as ChatService);
  });

  // ---------------------------------------------------------------------------
  // 1. 正常系: 有効な propertyId → 201 + { success: true, data: ChatSessionResult }
  // ---------------------------------------------------------------------------
  it('should return 201 with session result when propertyId is valid', async () => {
    // Arrange
    mockCreateSession.mockResolvedValue(mockSessionResult);

    // Act
    const req = makePostRequest({ propertyId: VALID_PROPERTY_ID });
    const response = await POST(req);

    // Assert
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: mockSessionResult,
    });
    expect(mockCreateSession).toHaveBeenCalledWith(VALID_PROPERTY_ID);
  });

  // ---------------------------------------------------------------------------
  // 2. 400 INVALID_PROPERTY_ID: propertyId が UUID 形式でない
  // ---------------------------------------------------------------------------
  it('should return 400 INVALID_PROPERTY_ID when propertyId is not a valid UUID', async () => {
    // Act
    const req = makePostRequest({ propertyId: INVALID_PROPERTY_ID });
    const response = await POST(req);

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
    // Service は呼ばれない
    expect(mockCreateSession).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // 3. 500 INTERNAL_SERVER_ERROR: Service が例外をスロー
  // ---------------------------------------------------------------------------
  it('should return 500 INTERNAL_SERVER_ERROR when service throws an exception', async () => {
    // Arrange
    mockCreateSession.mockRejectedValue(new Error('DB connection failed'));

    // Act
    const req = makePostRequest({ propertyId: VALID_PROPERTY_ID });
    const response = await POST(req);

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
