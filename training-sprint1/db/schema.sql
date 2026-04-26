-- ============================================================
-- Training Sprint 1 - Database Schema
-- Target: Supabase (PostgreSQL)
-- ============================================================

-- pg_trgm 拡張（日本語キーワード検索用）
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- updated_at 自動更新トリガー関数
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ENUM 型定義
-- ============================================================

CREATE TYPE feedback_value AS ENUM ('solved', 'unsolved');
CREATE TYPE message_type AS ENUM ('user', 'ai');

-- ============================================================
-- テーブル作成
-- ============================================================

-- properties: 物件情報とサポートデスク連絡先
CREATE TABLE properties (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  support_phone     VARCHAR(20)  NOT NULL,
  support_form_url  VARCHAR(500) NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- faq_categories: FAQカテゴリ（設備・ゴミ出しなど）
CREATE TABLE faq_categories (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL UNIQUE,
  icon       VARCHAR(255) NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_faq_categories_updated_at
  BEFORE UPDATE ON faq_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- faq_tags: FAQタグ（関連FAQ推薦に使用）
CREATE TABLE faq_tags (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- faqs: FAQ本体（中核テーブル）
CREATE TABLE faqs (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  UUID         NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  category_id  UUID         NOT NULL REFERENCES faq_categories(id) ON DELETE RESTRICT,
  title        VARCHAR(500) NOT NULL,
  body         TEXT         NOT NULL,
  access_count INT          NOT NULL DEFAULT 0,
  is_published BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_faqs_updated_at
  BEFORE UPDATE ON faqs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- faqs インデックス
CREATE INDEX idx_faqs_property_id  ON faqs(property_id);
CREATE INDEX idx_faqs_category_id  ON faqs(category_id);
CREATE INDEX idx_faqs_is_published ON faqs(is_published);
CREATE INDEX idx_faqs_access_count ON faqs(access_count DESC);

-- 全文検索用 GIN インデックス（pg_trgm、日本語対応）
CREATE INDEX idx_faqs_title_trgm ON faqs USING GIN (title gin_trgm_ops);
CREATE INDEX idx_faqs_body_trgm  ON faqs USING GIN (body  gin_trgm_ops);

-- faq_tag_mappings: FAQ ↔ タグ 多対多中間テーブル
CREATE TABLE faq_tag_mappings (
  faq_id UUID NOT NULL REFERENCES faqs(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES faq_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (faq_id, tag_id)
);

CREATE INDEX idx_faq_tag_mappings_tag_id ON faq_tag_mappings(tag_id);

-- feedback: FAQ解決フィードバック
CREATE TABLE feedback (
  id           UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  faq_id       UUID           NOT NULL REFERENCES faqs(id) ON DELETE CASCADE,
  value        feedback_value NOT NULL,
  submitted_at TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedback_faq_id ON feedback(faq_id);

-- chat_sessions: AIチャットセッション
CREATE TABLE chat_sessions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID        NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_sessions_property_id ON chat_sessions(property_id);

-- chat_messages: チャットメッセージ
CREATE TABLE chat_messages (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID         NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  message_type  message_type NOT NULL,
  body          TEXT         NOT NULL,
  is_unresolved BOOLEAN      NULL,
  sent_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_sent_at    ON chat_messages(sent_at);

-- question_suggestions: チャット開始時サジェスト質問
CREATE TABLE question_suggestions (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  text          VARCHAR(200) NOT NULL,
  display_order INT          NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_question_suggestions_updated_at
  BEFORE UPDATE ON question_suggestions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RLS（Row Level Security）有効化
-- 認証なし MVP のため全テーブル read を許可
-- ============================================================

ALTER TABLE properties         ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_tags           ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_tag_mappings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback           ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_suggestions ENABLE ROW LEVEL SECURITY;

-- anon ロールに全テーブルの SELECT を許可（入居者向けポータル）
CREATE POLICY allow_select_properties          ON properties          FOR SELECT TO anon USING (true);
CREATE POLICY allow_select_faq_categories      ON faq_categories      FOR SELECT TO anon USING (true);
CREATE POLICY allow_select_faq_tags            ON faq_tags            FOR SELECT TO anon USING (true);
CREATE POLICY allow_select_faqs                ON faqs                FOR SELECT TO anon USING (is_published = true);
CREATE POLICY allow_select_faq_tag_mappings    ON faq_tag_mappings    FOR SELECT TO anon USING (true);
CREATE POLICY allow_select_question_suggestions ON question_suggestions FOR SELECT TO anon USING (true);

-- anon にフィードバック・チャットの INSERT を許可
CREATE POLICY allow_insert_feedback       ON feedback       FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY allow_insert_chat_sessions  ON chat_sessions  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY allow_insert_chat_messages  ON chat_messages  FOR INSERT TO anon WITH CHECK (true);

-- anon にチャット履歴の SELECT を許可（session_id ベースのアクセス）
CREATE POLICY allow_select_chat_sessions  ON chat_sessions  FOR SELECT TO anon USING (true);
CREATE POLICY allow_select_chat_messages  ON chat_messages  FOR SELECT TO anon USING (true);

-- faqs アクセスカウント UPDATE を許可
CREATE POLICY allow_update_faqs_access_count ON faqs FOR UPDATE TO anon
  USING (true) WITH CHECK (true);
