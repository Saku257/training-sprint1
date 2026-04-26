import { z } from 'zod';

// パスパラメータ: propertyId と faqId（どちらも UUID 形式）
export const faqDetailParamSchema = z.object({
  propertyId: z.string().uuid('propertyId must be a valid UUID'),
  faqId: z.string().uuid('faqId must be a valid UUID'),
});

export type FaqDetailParam = z.infer<typeof faqDetailParamSchema>;

// クエリパラメータ: related エンドポイントの limit（デフォルト3、最大5）
export const relatedQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val !== undefined ? parseInt(val, 10) : 3))
    .pipe(z.number().int().min(1, 'limit must be at least 1').max(5, 'limit must be at most 5')),
});

export type RelatedQuery = z.infer<typeof relatedQuerySchema>;

// クエリパラメータ: popular エンドポイントの limit（デフォルト5、最大10）
export const popularQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val !== undefined ? parseInt(val, 10) : 5))
    .pipe(z.number().int().min(1, 'limit must be at least 1').max(10, 'limit must be at most 10')),
});

export type PopularQuery = z.infer<typeof popularQuerySchema>;

// GET /api/properties/:propertyId/faqs/popular のレスポンス要素
const faqPopularItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  categoryName: z.string(),
});

// GET /api/properties/:propertyId/faqs/popular のレスポンス全体
export const faqPopularResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(faqPopularItemSchema),
});

export type FaqPopularResponse = z.infer<typeof faqPopularResponseSchema>;

// GET /api/properties/:propertyId/faqs/:faqId のレスポンス全体
export const faqDetailResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    id: z.string().uuid(),
    title: z.string(),
    body: z.string(),
    categoryName: z.string(),
    updatedAt: z.string(),
    supportDesk: z.object({
      phone: z.string(),
      formUrl: z.string().url().nullable(),
    }),
  }),
});

export type FaqDetailResponse = z.infer<typeof faqDetailResponseSchema>;

// GET /api/properties/:propertyId/faqs/:faqId/related のレスポンス要素
const faqRelatedItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
});

// GET /api/properties/:propertyId/faqs/:faqId/related のレスポンス全体
export const faqRelatedResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(faqRelatedItemSchema),
});

export type FaqRelatedResponse = z.infer<typeof faqRelatedResponseSchema>;
