// フィードバックの値（解決済み / 未解決）
export type FeedbackValue = 'solved' | 'unsolved';

// Feedback ドメインモデル（DBの型をそのまま、全カラム）
export type Feedback = {
  id: string;
  faq_id: string;
  value: FeedbackValue;
  submitted_at: string;
};

// APIレスポンス用（POST /api/faqs/:faqId/feedback の data）
export type FeedbackResult = {
  id: string;
  faqId: string;
  value: FeedbackValue;
  submittedAt: string;
};
