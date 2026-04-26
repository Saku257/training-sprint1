import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { SendMessageResult } from '@/domain/models/chat';

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
const mockSendMessage = vi.fn();
vi.mocked(ChatService).mockImplementation(() => ({
  createSession: vi.fn(),
  sendMessage: mockSendMessage,
}) as unknown as ChatService);

// Route Handler を import（まだ存在しないため、RED 状態になる）
import { POST } from '@/app/api/chat/sessions/[sessionId]/messages/route';

// ------------------------------------------------------------------------------------
// テスト用定数
// ------------------------------------------------------------------------------------
const VALID_SESSION_ID = 'a1b2c3d4-e5f6-4890-a234-ef1234567890';
const VALID_FAQ_ID = 'b2c3d4e5-f6a7-4890-b234-123456789012';
const INVALID_SESSION_ID = 'not-a-uuid';
const INVALID_FAQ_ID = 'also-not-a-uuid';

const mockSendMessageResult: SendMessageResult = {
  userMessage: {
    id: 'c3d4e5f6-a7b8-4890-c234-234567890123',
    type: 'user',
    body: 'テスト質問',
    sentAt: '2024-06-01T10:01:00.000Z',
  },
  aiMessage: {
    id: 'd4e5f6a7-b8c9-4890-d234-345678901234',
    type: 'ai',
    body: 'テスト回答',
    isUnresolved: false,
    relatedFaqs: [],
    sentAt: '2024-06-01T10:01:05.000Z',
  },
  supportDesk: null,
};

// ------------------------------------------------------------------------------------
// テスト用ヘルパー
// ------------------------------------------------------------------------------------
const makePostRequest = (sessionId: string, body: unknown) => {
  const url = new URL(`http://localhost/api/chat/sessions/${sessionId}/messages`);
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
};

const buildContext = (sessionId: string) => ({
  params: Promise.resolve({ sessionId }),
});

// ------------------------------------------------------------------------------------
// テストスイート
// ------------------------------------------------------------------------------------
describe('POST /api/chat/sessions/[sessionId]/messages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ChatService).mockImplementation(() => ({
      createSession: vi.fn(),
      sendMessage: mockSendMessage,
    }) as unknown as ChatService);
  });

  // ---------------------------------------------------------------------------
  // 1. 正常系: 基本メッセージ送信 → 201 + SendMessageResult
  // ---------------------------------------------------------------------------
  it('should return 201 with SendMessageResult when basic message is sent', async () => {
    // Arrange
    mockSendMessage.mockResolvedValue(mockSendMessageResult);

    // Act
    const req = makePostRequest(VALID_SESSION_ID, { message: 'テスト質問' });
    const ctx = buildContext(VALID_SESSION_ID);
    const response = await POST(req, ctx);

    // Assert
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: mockSendMessageResult,
    });
    expect(mockSendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: VALID_SESSION_ID,
        message: 'テスト質問',
      })
    );
  });

  // ---------------------------------------------------------------------------
  // 2. 正常系: faqId 付きメッセージ → 201 + SendMessageResult
  // ---------------------------------------------------------------------------
  it('should return 201 and pass faqId to service when faqId is provided', async () => {
    // Arrange
    mockSendMessage.mockResolvedValue(mockSendMessageResult);

    // Act
    const req = makePostRequest(VALID_SESSION_ID, {
      message: 'このFAQについて教えてください',
      faqId: VALID_FAQ_ID,
    });
    const ctx = buildContext(VALID_SESSION_ID);
    const response = await POST(req, ctx);

    // Assert
    expect(response.status).toBe(201);
    expect(mockSendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: VALID_SESSION_ID,
        message: 'このFAQについて教えてください',
        faqId: VALID_FAQ_ID,
      })
    );
  });

  // ---------------------------------------------------------------------------
  // 3. 400 INVALID_SESSION_ID: sessionId が UUID 形式でない
  // ---------------------------------------------------------------------------
  it('should return 400 INVALID_SESSION_ID when sessionId is not a valid UUID', async () => {
    // Act
    const req = makePostRequest(INVALID_SESSION_ID, { message: 'テスト' });
    const ctx = buildContext(INVALID_SESSION_ID);
    const response = await POST(req, ctx);

    // Assert
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({
      success: false,
      error: {
        code: 'INVALID_SESSION_ID',
        message: expect.any(String),
      },
    });
    // Service は呼ばれない
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // 4. 400 INVALID_MESSAGE: message が空
  // ---------------------------------------------------------------------------
  it('should return 400 INVALID_MESSAGE when message is empty', async () => {
    // Act
    const req = makePostRequest(VALID_SESSION_ID, { message: '' });
    const ctx = buildContext(VALID_SESSION_ID);
    const response = await POST(req, ctx);

    // Assert
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({
      success: false,
      error: {
        code: 'INVALID_MESSAGE',
        message: expect.any(String),
      },
    });
    // Service は呼ばれない
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // 5. 400 INVALID_FAQ_ID: faqId が UUID 形式でない
  // ---------------------------------------------------------------------------
  it('should return 400 INVALID_FAQ_ID when faqId is provided but not a valid UUID', async () => {
    // Act
    const req = makePostRequest(VALID_SESSION_ID, {
      message: 'テスト質問',
      faqId: INVALID_FAQ_ID,
    });
    const ctx = buildContext(VALID_SESSION_ID);
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
    // Service は呼ばれない
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // 6. 500 INTERNAL_SERVER_ERROR: Service が例外をスロー
  // ---------------------------------------------------------------------------
  it('should return 500 INTERNAL_SERVER_ERROR when service throws an exception', async () => {
    // Arrange
    mockSendMessage.mockRejectedValue(new Error('DB connection failed'));

    // Act
    const req = makePostRequest(VALID_SESSION_ID, { message: 'テスト質問' });
    const ctx = buildContext(VALID_SESSION_ID);
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
