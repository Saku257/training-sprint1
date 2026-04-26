// FaqCategory ドメインモデル（DBの型をそのまま）
export type FaqCategory = {
  id: string;
  name: string;
  icon: string | null;
  created_at: string;
  updated_at: string;
};

// APIレスポンス用（GET /api/properties/:propertyId/faq-categories の data 要素）
export type FaqCategoryListItem = {
  id: string;
  name: string;
  icon: string | null;
};
