import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ChatSessionResult, SendMessageResult, AiAnswerOutput } from '@/domain/models/chat';
import type { FaqSearchResultItem, FaqDetailItem } from '@/domain/models/faq';

import { ChatService } from '@/domain/services/chat.service';

// LLM ラッパーのモック（実装前も含めてモジュール全体をモック）
vi.mock('@/app/lib/llm/chat', () => ({
  generateAiAnswer: vi.fn(),
}));
import { generateAiAnswer } from '@/app/lib/llm/chat';
const mockGenerateAiAnswer = vi.mocked(generateAiAnswer);

// ---- モック型定義 ----
type ChatSessionRepositoryMock = {
  create: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
};

type ChatMessageRepositoryMock = {
  create: ReturnType<typeof vi.fn>;
  findBySessionId: ReturnType<typeof vi.fn>;
  countBySessionId: ReturnType<typeof vi.fn>;
};

type FaqRepositoryMock = {
  searchByPropertyId: ReturnType<typeof vi.fn>;
  findDetailByPropertyAndId: ReturnType<typeof vi.fn>;
};

type SupabaseClientMock = {
  from: ReturnType<typeof vi.fn>;
};
// ----------------------

// テスト用フィクスチャ
const SESSION_ID = 'session-uuid-001';
const PROPERTY_ID = 'property-uuid-001';
const FAQ_ID = 'faq-uuid-001';

const mockFaqList: FaqSearchResultItem[] = [
  { id: 'faq-1', title: 'チェックインについて', bodyExcerpt: 'チェックインは15時からです。', categoryName: '宿泊' },
  { id: 'faq-2', title: 'Wi-Fiについて', bodyExcerpt: 'Wi-Fiのパスワードは部屋に掲示しています。', categoryName: '設備' },
];

const mockFaqDetail: FaqDetailItem = {
  id: FAQ_ID,
  title: 'チェックインについて',
  body: 'チェックインは15時からです。事前連絡で早めのチェックインも可能です。',
  categoryName: '宿泊',
  updatedAt: '2024-01-01T00:00:00Z',
  supportDesk: {
    phone: '03-1234-5678',
    formUrl: 'https://example.com/support',
  },
};

const mockSessionResult: ChatSessionResult = {
  sessionId: SESSION_ID,
  startedAt: '2024-06-01T10:00:00Z',
};

const mockUserMessage = {
  id: 'msg-user-001',
  session_id: SESSION_ID,
  message_type: 'user' as const,
  body: 'チェックインは何時からですか？',
  is_unresolved: null,
  sent_at: '2024-06-01T10:01:00Z',
};

const mockAiMessage = {
  id: 'msg-ai-001',
  session_id: SESSION_ID,
  message_type: 'ai' as const,
  body: 'チェックインは15時からです。',
  is_unresolved: false,
  sent_at: '2024-06-01T10:01:05Z',
};

const mockAiOutput: AiAnswerOutput = {
  answer: 'チェックインは15時からです。',
  isUnresolved: false,
  relatedFaqIds: ['faq-1'],
};

describe('ChatService', () => {
  let mockSessionRepository: ChatSessionRepositoryMock;
  let mockMessageRepository: ChatMessageRepositoryMock;
  let mockFaqRepository: FaqRepositoryMock;
  let mockSupabaseClient: SupabaseClientMock;
  let service: ChatService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSessionRepository = {
      create: vi.fn(),
      findById: vi.fn(),
    };

    mockMessageRepository = {
      create: vi.fn(),
      findBySessionId: vi.fn(),
      countBySessionId: vi.fn(),
    };

    mockFaqRepository = {
      searchByPropertyId: vi.fn(),
      findDetailByPropertyAndId: vi.fn(),
    };

    // Supabase クライアントのモック（supportDesk 取得用）
    const mockSingle = vi.fn().mockResolvedValue({
      data: { support_phone: '03-1234-5678', support_form_url: 'https://example.com/support' },
      error: null,
    });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockSupabaseClient = {
      from: vi.fn().mockReturnValue({ select: mockSelect }),
    };

    service = new ChatService(
      mockSessionRepository as unknown as import('@/domain/repositories/chat-session.repository').ChatSessionRepository,
      mockMessageRepository as unknown as import('@/domain/repositories/chat-message.repository').ChatMessageRepository,
      mockFaqRepository as unknown as import('@/domain/repositories/faq.repository').FaqRepository,
      mockSupabaseClient as unknown as import('@supabase/supabase-js').SupabaseClient,
      mockGenerateAiAnswer
    );
  });

  describe('createSession', () => {
    it('should call sessionRepository.create with propertyId', async () => {
      // Arrange
      mockSessionRepository.create.mockResolvedValue(mockSessionResult);

      // Act
      await service.createSession(PROPERTY_ID);

      // Assert: sessionRepository.create が propertyId で呼ばれる
      expect(mockSessionRepository.create).toHaveBeenCalledWith(PROPERTY_ID);
    });

    it('should return result containing sessionId and startedAt', async () => {
      // Arrange
      mockSessionRepository.create.mockResolvedValue(mockSessionResult);

      // Act
      const result = await service.createSession(PROPERTY_ID);

      // Assert: 結果に sessionId と startedAt が含まれる
      expect(result.sessionId).toBe(SESSION_ID);
      expect(result.startedAt).toBe('2024-06-01T10:00:00Z');
    });
  });

  describe('sendMessage', () => {
    // sendMessage の各テストで共通するデフォルト設定
    const defaultParams = {
      sessionId: SESSION_ID,
      message: 'チェックインは何時からですか？',
      isFirstMessage: false,
    };

    beforeEach(() => {
      // セッション存在確認
      mockSessionRepository.findById.mockResolvedValue({ id: SESSION_ID, property_id: PROPERTY_ID });
      // FAQ 検索（全件）
      mockFaqRepository.searchByPropertyId.mockResolvedValue(mockFaqList);
      // FAQ 詳細（初回メッセージ + faqId あり のケース用）
      mockFaqRepository.findDetailByPropertyAndId.mockResolvedValue(mockFaqDetail);
      // ユーザーメッセージ保存
      mockMessageRepository.create
        .mockResolvedValueOnce(mockUserMessage)  // 1回目: ユーザーメッセージ
        .mockResolvedValueOnce(mockAiMessage);   // 2回目: AI メッセージ
      // AI 回答生成
      mockGenerateAiAnswer.mockResolvedValue(mockAiOutput);
    });

    it('should save user message via messageRepository.create with messageType=user', async () => {
      // Act
      await service.sendMessage(defaultParams);

      // Assert: ユーザーメッセージが messageType='user' で保存される
      expect(mockMessageRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: SESSION_ID,
          messageType: 'user',
          body: 'チェックインは何時からですか？',
        })
      );
    });

    it('should call generateAiAnswer', async () => {
      // Act
      await service.sendMessage(defaultParams);

      // Assert: generateAiAnswer が呼ばれる
      expect(mockGenerateAiAnswer).toHaveBeenCalledTimes(1);
    });

    it('should save AI answer message via messageRepository.create with messageType=ai', async () => {
      // Act
      await service.sendMessage(defaultParams);

      // Assert: AI メッセージが messageType='ai' で保存される
      expect(mockMessageRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: SESSION_ID,
          messageType: 'ai',
          body: mockAiOutput.answer,
          isUnresolved: mockAiOutput.isUnresolved,
        })
      );
    });

    it('should call faqRepository.findDetailByPropertyAndId when isFirstMessage=true and faqId is provided', async () => {
      // Arrange: セッションから propertyId を取得できるようにする
      mockSessionRepository.findById.mockResolvedValue({ id: SESSION_ID, property_id: PROPERTY_ID });

      // Act: 初回メッセージかつ faqId あり
      await service.sendMessage({
        sessionId: SESSION_ID,
        message: 'このFAQについて詳しく教えてください',
        faqId: FAQ_ID,
        isFirstMessage: true,
      });

      // Assert: findDetailByPropertyAndId が呼ばれる
      expect(mockFaqRepository.findDetailByPropertyAndId).toHaveBeenCalled();
    });

    it('should not call faqRepository.findDetailByPropertyAndId when isFirstMessage=false even if faqId is provided', async () => {
      // Act: 2回目以降のメッセージ（faqId あり）
      await service.sendMessage({
        sessionId: SESSION_ID,
        message: 'もう少し詳しく教えてください',
        faqId: FAQ_ID,
        isFirstMessage: false,
      });

      // Assert: findDetailByPropertyAndId は呼ばれない（初回メッセージでないため無視）
      expect(mockFaqRepository.findDetailByPropertyAndId).not.toHaveBeenCalled();
    });

    it('should return supportDesk as non-null when isUnresolved=true', async () => {
      // Arrange: AI が未解決と判断するケース
      const unresolvedAiOutput: AiAnswerOutput = {
        answer: '申し訳ありません。サポートデスクにお問い合わせください。',
        isUnresolved: true,
        relatedFaqIds: [],
      };
      mockGenerateAiAnswer.mockResolvedValue(unresolvedAiOutput);

      const unresolvedAiMessage = {
        ...mockAiMessage,
        body: unresolvedAiOutput.answer,
        is_unresolved: true,
      };
      mockMessageRepository.create
        .mockReset()
        .mockResolvedValueOnce(mockUserMessage)
        .mockResolvedValueOnce(unresolvedAiMessage);

      // Act
      const result: SendMessageResult = await service.sendMessage(defaultParams);

      // Assert: isUnresolved=true の場合 supportDesk が null 以外で返る
      expect(result.supportDesk).not.toBeNull();
    });
  });
});
