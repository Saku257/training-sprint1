import { z } from 'zod';

// ----------------------------------------------------------------
// GET /api/question-suggestions
// ----------------------------------------------------------------

// クエリパラメータ: limit（省略可、デフォルト5、最大5）
export const questionSuggestionQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val !== undefined ? parseInt(val, 10) : 5))
    .pipe(z.number().int().min(1, 'limit must be at least 1').max(5, 'limit must be at most 5')),
});

export type QuestionSuggestionQuery = z.infer<typeof questionSuggestionQuerySchema>;

// GET /api/question-suggestions のレスポンス要素
const questionSuggestionItemSchema = z.object({
  id: z.string().uuid(),
  text: z.string(),
});

// GET /api/question-suggestions のレスポンス全体
export const questionSuggestionsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(questionSuggestionItemSchema),
});

export type QuestionSuggestionsResponse = z.infer<typeof questionSuggestionsResponseSchema>;

// ----------------------------------------------------------------
// POST /api/chat/sessions
// ----------------------------------------------------------------

// リクエストボディ: propertyId（UUID 形式）
export const createSessionBodySchema = z.object({
  propertyId: z.string().uuid('propertyId must be a valid UUID'),
});

export type CreateSessionBody = z.infer<typeof createSessionBodySchema>;

// POST /api/chat/sessions のレスポンス全体
export const createSessionResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    sessionId: z.string().uuid(),
    startedAt: z.string(),
  }),
});

export type CreateSessionResponse = z.infer<typeof createSessionResponseSchema>;

// ----------------------------------------------------------------
// POST /api/chat/sessions/[sessionId]/messages
// ----------------------------------------------------------------

// パスパラメータ: sessionId（UUID 形式）
export const sessionIdParamSchema = z.object({
  sessionId: z.string().uuid('sessionId must be a valid UUID'),
});

export type SessionIdParam = z.infer<typeof sessionIdParamSchema>;

// リクエストボディ: message（trim後に1文字以上・200文字以下）
export const sendMessageBodySchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'message must not be empty')
    .max(200, 'message must be 200 characters or less'),
  faqId: z.string().uuid().optional(),
});

export type SendMessageBody = z.infer<typeof sendMessageBodySchema>;

// POST /api/chat/sessions/[sessionId]/messages のレスポンス要素（関連FAQ）
const relatedFaqItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
});

// POST /api/chat/sessions/[sessionId]/messages のレスポンス全体
export const sendMessageResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    userMessage: z.object({
      id: z.string().uuid(),
      type: z.literal('user'),
      body: z.string(),
      sentAt: z.string(),
    }),
    aiMessage: z.object({
      id: z.string().uuid(),
      type: z.literal('ai'),
      body: z.string(),
      isUnresolved: z.boolean(),
      relatedFaqs: z.array(relatedFaqItemSchema),
      sentAt: z.string(),
    }),
    supportDesk: z
      .object({
        phone: z.string(),
        formUrl: z.string().url().nullable(),
      })
      .nullable(),
  }),
});

export type SendMessageResponse = z.infer<typeof sendMessageResponseSchema>;
