// QuestionSuggestion ドメインモデル（DBの型をそのまま、全カラム）
export type QuestionSuggestion = {
  id: string;
  text: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

// APIレスポンス用（GET /api/question-suggestions の data 要素）
export type QuestionSuggestionItem = {
  id: string;
  text: string;
};

// ChatSession ドメインモデル（DBの型をそのまま、全カラム）
export type ChatSession = {
  id: string;
  property_id: string;
  started_at: string;
};

// APIレスポンス用（POST /api/chat/sessions の data）
export type ChatSessionResult = {
  sessionId: string;
  startedAt: string;
};

// メッセージタイプ（'user' | 'ai'）
export type MessageType = 'user' | 'ai';

// ChatMessage ドメインモデル（DBの型をそのまま、全カラム）
export type ChatMessage = {
  id: string;
  session_id: string;
  message_type: MessageType;
  body: string;
  is_unresolved: boolean | null;
  sent_at: string;
};

// AI回答の Structured Output 型（LLM ラッパーの返り値）
export type AiAnswerOutput = {
  answer: string;
  isUnresolved: boolean;
  relatedFaqIds: string[]; // FAQ ID のリスト（最大3件）
};

// メッセージ送信APIレスポンスの内部型（POST /api/chat/sessions/[sessionId]/messages の data）
export type SendMessageResult = {
  userMessage: {
    id: string;
    type: 'user';
    body: string;
    sentAt: string;
  };
  aiMessage: {
    id: string;
    type: 'ai';
    body: string;
    isUnresolved: boolean;
    relatedFaqs: {
      id: string;
      title: string;
    }[];
    sentAt: string;
  };
  supportDesk: {
    phone: string;
    formUrl: string | null;
  } | null;
};
