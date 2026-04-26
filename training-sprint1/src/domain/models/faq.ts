// Faq ドメインモデル（DBの型をそのまま、全カラム）
export type Faq = {
  id: string;
  property_id: string;
  category_id: string;
  title: string;
  body: string;
  access_count: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

// APIレスポンス用（GET /api/properties/:propertyId/faqs/popular の data 要素）
export type FaqPopularItem = {
  id: string;
  title: string;
  categoryName: string;
};

// APIレスポンス用（GET /api/properties/:propertyId/faqs/search の items 要素）
export type FaqSearchResultItem = {
  id: string;
  title: string;
  bodyExcerpt: string; // body の冒頭 100文字
  categoryName: string;
};

// APIレスポンス用（GET /api/properties/:propertyId/faqs/:faqId の data）
export type FaqDetailItem = {
  id: string;
  title: string;
  body: string;
  categoryName: string;
  updatedAt: string;
  supportDesk: {
    phone: string;
    formUrl: string | null;
  };
};

// APIレスポンス用（GET /api/properties/:propertyId/faqs/:faqId/related の data 要素）
export type FaqRelatedItem = {
  id: string;
  title: string;
};
