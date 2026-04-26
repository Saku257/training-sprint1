-- Migration 001: Initial Schema
-- Description: 初期テーブル・スキーマ作成（入居者向けテナントポータル）

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ENUM 型（重複時は無視）
DO $$ BEGIN
  CREATE TYPE feedback_value AS ENUM ('solved', 'unsolved');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE message_type AS ENUM ('user', 'ai');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS properties (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(255) NOT NULL,
  support_phone    VARCHAR(20)  NOT NULL,
  support_form_url VARCHAR(500) NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS faq_categories (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL UNIQUE,
  icon       VARCHAR(255) NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS faq_tags (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS faqs (
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

CREATE TABLE IF NOT EXISTS faq_tag_mappings (
  faq_id UUID NOT NULL REFERENCES faqs(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES faq_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (faq_id, tag_id)
);

CREATE TABLE IF NOT EXISTS feedback (
  id           UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  faq_id       UUID           NOT NULL REFERENCES faqs(id) ON DELETE CASCADE,
  value        feedback_value NOT NULL,
  submitted_at TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_sessions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID        NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID         NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  message_type  message_type NOT NULL,
  body          TEXT         NOT NULL,
  is_unresolved BOOLEAN      NULL,
  sent_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS question_suggestions (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  text          VARCHAR(200) NOT NULL,
  display_order INT          NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- インデックス（既存の場合は無視）
CREATE INDEX IF NOT EXISTS idx_faqs_property_id   ON faqs(property_id);
CREATE INDEX IF NOT EXISTS idx_faqs_category_id   ON faqs(category_id);
CREATE INDEX IF NOT EXISTS idx_faqs_is_published  ON faqs(is_published);
CREATE INDEX IF NOT EXISTS idx_faqs_access_count  ON faqs(access_count DESC);
CREATE INDEX IF NOT EXISTS idx_faqs_title_trgm    ON faqs USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_faqs_body_trgm     ON faqs USING GIN (body  gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_faq_tag_mappings_tag_id ON faq_tag_mappings(tag_id);
CREATE INDEX IF NOT EXISTS idx_feedback_faq_id         ON feedback(faq_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_property_id ON chat_sessions(property_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id  ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sent_at     ON chat_messages(sent_at);
