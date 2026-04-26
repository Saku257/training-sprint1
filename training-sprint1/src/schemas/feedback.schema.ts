import { z } from 'zod';

// パスパラメータ: faqId（UUID 形式）
export const feedbackParamSchema = z.object({
  faqId: z.string().uuid('faqId must be a valid UUID'),
});

export type FeedbackParam = z.infer<typeof feedbackParamSchema>;

// リクエストボディ: value は "solved" または "unsolved" のみ許可
export const feedbackBodySchema = z.object({
  value: z.enum(['solved', 'unsolved'] as const, {
    error: 'value must be "solved" or "unsolved"',
  }),
});

export type FeedbackBody = z.infer<typeof feedbackBodySchema>;

// POST /api/faqs/:faqId/feedback のレスポンス全体
export const feedbackResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    id: z.string().uuid(),
    faqId: z.string().uuid(),
    value: z.enum(['solved', 'unsolved']),
    submittedAt: z.string(),
  }),
});

export type FeedbackResponse = z.infer<typeof feedbackResponseSchema>;
