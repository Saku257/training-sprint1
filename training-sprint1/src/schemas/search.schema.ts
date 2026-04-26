import { z } from 'zod';

// パスパラメータ: propertyId（UUID 形式）
export const searchParamSchema = z.object({
  propertyId: z.string().uuid('propertyId must be a valid UUID'),
});

export type SearchParam = z.infer<typeof searchParamSchema>;

// クエリパラメータ: q と categoryId のどちらか一方が必須
// - q は最大50文字、空白のみ不可
// - categoryId は UUID 形式
// - 両方指定された場合は両方を受け入れる（優先度は Service 側で処理）
// - どちらも指定されていない場合は invalid（400 INVALID_SEARCH_QUERY）
export const searchQuerySchema = z
  .object({
    q: z
      .string()
      .trim()
      .min(1, 'q must not be blank')
      .max(50, 'q must be at most 50 characters')
      .optional(),
    categoryId: z.string().uuid('categoryId must be a valid UUID').optional(),
  })
  .refine((data) => data.q !== undefined || data.categoryId !== undefined, {
    message: 'Either q or categoryId must be provided',
    path: [],
  });

export type SearchQuery = z.infer<typeof searchQuerySchema>;

// GET /api/properties/:propertyId/faqs/search のレスポンス要素
const searchResultItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  bodyExcerpt: z.string(), // body の冒頭 100文字
  categoryName: z.string(),
});

export type SearchResultItem = z.infer<typeof searchResultItemSchema>;

// GET /api/properties/:propertyId/faqs/search のレスポンス全体
export const faqSearchResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    total: z.number().int().min(0),
    items: z.array(searchResultItemSchema),
  }),
});

export type FaqSearchResponse = z.infer<typeof faqSearchResponseSchema>;
