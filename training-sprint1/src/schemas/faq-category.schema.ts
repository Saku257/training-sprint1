import { z } from 'zod';

// パスパラメータ: propertyId（UUID 形式）
export const propertyIdParamSchema = z.object({
  propertyId: z.string().uuid('propertyId must be a valid UUID'),
});

export type PropertyIdParam = z.infer<typeof propertyIdParamSchema>;

// GET /api/properties/:propertyId/faq-categories のレスポンス要素
const faqCategoryListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  icon: z.string().nullable(),
});

// GET /api/properties/:propertyId/faq-categories のレスポンス全体
export const faqCategoryListResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(faqCategoryListItemSchema),
});

export type FaqCategoryListResponse = z.infer<typeof faqCategoryListResponseSchema>;

// 共通エラーレスポンス
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
