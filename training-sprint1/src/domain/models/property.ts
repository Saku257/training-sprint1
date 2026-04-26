// Property ドメインモデル（DBの型をそのまま）
export type Property = {
  id: string;
  name: string;
  support_phone: string;
  support_form_url: string | null;
  created_at: string;
  updated_at: string;
};
