# Sprint 1 実装計画

## 概要

三菱地所 テナントポータル MVP の実装計画。
入居者が人を介さずに FAQ・AIチャットで自己解決できる 4 画面を構築する。

Vertical Slice Architecture（VSA）に基づいて機能を分割し、
**Next.js 14（App Router）+ Supabase** のフルスタック構成で
Phase 0 → Phase 1 → Phase 2 の順で実装する。

### 技術スタック

| レイヤー | 技術 |
|---------|------|
| フレームワーク | Next.js 14（App Router） |
| DB | Supabase（PostgreSQL） |
| LLM | Open Responses API |
| デプロイ | Vercel + Supabase |

### ディレクトリ構造

```
app/
  (routes)/          # ページ・レイアウト
  api/               # Route Handlers
  actions/           # Server Actions
  components/        # UIコンポーネント
  lib/
    supabase/        # Supabase client
    llm/             # LLM API wrapper
    utils/           # 共通ユーティリティ
domain/
  models/            # ドメインモデル型定義
  services/          # ビジネスロジック
  repositories/      # DB操作抽象（Repository パターン）
schemas/             # Zod schema / 入出力型
types/               # 共通型定義
```

---

## Phase 0: Foundation（基盤構築）

> foundation エージェントが Slice 0-1 ～ 0-3 を順序通りにガイドする。

| Slice | 内容 | スキル |
|-------|------|--------|
| 0-1 | Next.js プロジェクト初期化（App Router・TypeScript・Tailwind CSS・ディレクトリ構造） | `/foundation-project-setup` |
| 0-2 | Supabase DB セットアップ（プロジェクト作成・接続確認・ Row Level Security 初期設定） | `/foundation-database-setup` |
| 0-3 | マイグレーション・シーダー（全テーブル DDL・サンプルデータ投入） | `/foundation-migration-seeder` |

### Phase 0 完了条件

- [ ] `npm run dev` でローカル開発サーバーが起動する
- [ ] Supabase プロジェクトに接続できる
- [ ] 全テーブルが Supabase に作成済み（9テーブル）
- [ ] シーダーデータが投入済み（properties / faq_categories / faqs）

---

## Phase 1: 基本FAQ機能

### 依存関係: Foundation（Phase 0）完了が前提

---

### Slice 1: ホーム画面（P001）

**概要**: 入居者のエントリーポイント。キーワード検索・カテゴリ選択・よく見られるFAQ・AIチャット起動を提供する。

**対象画面**: `app/(routes)/page.tsx`（P001 ホーム画面）

**Route Handlers（バック）**:
- `GET /api/properties/[propertyId]/faq-categories` — FAQカテゴリ一覧取得
- `GET /api/properties/[propertyId]/faqs/popular` — よく見られるFAQ取得（上位5件）

**関連テーブル**: `properties`, `faq_categories`, `faqs`

**シードデータ**（Phase 0 の 0-3 で投入）:
- `properties`: テスト用物件 1 件（サポートデスク連絡先込み）
- `faq_categories`: 設備・ゴミ出し・駐車場など 5〜8 件
- `faqs`: カテゴリ紐づき FAQサンプル 10〜20 件（`is_published=true`）

**実装順序（TDD）**:
1. `domain/repositories/faq-category.repository.ts` テスト → 実装
2. `domain/repositories/faq.repository.ts`（popular）テスト → 実装
3. `domain/services/faq-category.service.ts` テスト → 実装
4. `domain/services/faq.service.ts`（popular）テスト → 実装
5. `app/api/properties/[propertyId]/faq-categories/route.ts` テスト → 実装
6. `app/api/properties/[propertyId]/faqs/popular/route.ts` テスト → 実装
7. `app/components/` UI コンポーネントテスト → 実装
8. `app/(routes)/page.tsx` ページ組み立て・統合確認

**チェックリスト**:
- [ ] Repository: faq_categories 一覧取得 実装・テスト完了
- [ ] Repository: faqs popular（access_count 降順 top5）実装・テスト完了
- [ ] Service: カテゴリ一覧 実装・テスト完了
- [ ] Service: よく見られるFAQ 実装・テスト完了
- [ ] Route Handler: `GET /api/properties/[propertyId]/faq-categories` 完了
- [ ] Route Handler: `GET /api/properties/[propertyId]/faqs/popular` 完了
- [ ] UI: 検索バー（キーワード入力 → P002 遷移）実装
- [ ] UI: FAQカテゴリカード（タップ → P002 遷移）実装
- [ ] UI: よく見られるFAQリスト（タップ → P003 遷移）実装
- [ ] UI: 「AIに聞く」ボタン（タップ → P004 遷移）実装
- [ ] API 疎通確認・統合テスト完了

---

### Slice 2: FAQ検索（P002）

**概要**: キーワード・カテゴリIDで FAQを検索し、結果を一覧表示する。0件時はAIチャットへ誘導する。

**依存**: Slice 1（propertyId の存在・FAQデータ）

**対象画面**: `app/(routes)/search/page.tsx`（P002 検索結果画面）

**Route Handlers（バック）**:
- `GET /api/properties/[propertyId]/faqs/search` — FAQ検索（キーワード or カテゴリID）

**関連テーブル**: `faqs`, `faq_categories`

**検索方式**（Supabase / PostgreSQL）:
- キーワード検索: `ilike('%keyword%')` で title・body を部分一致（MVP）
- カテゴリ絞り込み: `category_id = :categoryId` でフィルタ

**バリデーション**（Zod: `schemas/search.schema.ts`）:
- `q` と `categoryId` の両方未指定は `400 INVALID_SEARCH_QUERY`
- `q` が50文字超過・空白のみも `400`
- 両方指定時は `q` 優先

**実装順序（TDD）**:
1. `schemas/search.schema.ts` Zod スキーマ定義
2. `domain/repositories/faq.repository.ts`（search: ilike）テスト → 実装
3. `domain/services/faq.service.ts`（search）テスト → 実装
4. `app/api/properties/[propertyId]/faqs/search/route.ts` テスト → 実装
5. `app/components/` 検索結果リスト・検索バーコンポーネントテスト → 実装
6. `app/(routes)/search/page.tsx` ページ組み立て・P001 との繋ぎ込み確認

**チェックリスト**:
- [ ] Repository: faqs search（ilike, categoryId filter）実装・テスト完了
- [ ] Service: FAQ検索ロジック 実装・テスト完了
- [ ] Route Handler: `GET /api/properties/[propertyId]/faqs/search` 完了
- [ ] バリデーション: 50文字・空白・両方未指定 テスト完了
- [ ] UI: 検索結果リスト（タイトル・カテゴリタグ・冒頭テキスト2行）実装
- [ ] UI: 検索バー再入力・再検索実装
- [ ] UI: 0件時「AIに聞く」バナー表示実装
- [ ] P001 → P002 のキーワード・カテゴリ引き継ぎ確認
- [ ] 統合テスト完了

---

### Slice 3: FAQ詳細・フィードバック（P003）

**概要**: FAQ詳細回答を表示し、フィードバック収集・関連FAQ誘導・サポートデスク連絡先を提供する。

**依存**: Slice 1（properties のサポートデスク情報）, Slice 2（FAQ一覧からの遷移）

**対象画面**: `app/(routes)/faqs/[faqId]/page.tsx`（P003 FAQ詳細画面）

**Route Handlers（バック）**:
- `GET /api/properties/[propertyId]/faqs/[faqId]` — FAQ詳細取得（access_count +1 の副作用あり）
- `GET /api/properties/[propertyId]/faqs/[faqId]/related` — 関連FAQ取得（最大3件）
- `POST /api/faqs/[faqId]/feedback` — フィードバック送信（`solved` / `unsolved`）

**関連テーブル**: `faqs`, `faq_categories`, `properties`, `faq_tag_mappings`, `faq_tags`, `feedback`

**実装上の注意**:
- FAQ詳細取得時に `access_count` を同期 +1 する
- 関連FAQ取得は `faq_tag_mappings` → `faq_tags` → `faqs` を JOIN し、N+1 問題を防ぐ（Supabase の `.select()` + foreign key expand を活用）
- フィードバック `value` は `solved` / `unsolved` のみ受付（それ以外は 400）
- 関連FAQシードデータ: `faq_tags` + `faq_tag_mappings` を Phase 0-3 シードに追加

**実装順序（TDD）**:
1. `domain/repositories/faq.repository.ts`（detail: access_count +1）テスト → 実装
2. `domain/repositories/faq.repository.ts`（related: JOIN）テスト → 実装
3. `domain/repositories/feedback.repository.ts` テスト → 実装
4. `domain/services/faq.service.ts`（detail, related）テスト → 実装
5. `domain/services/feedback.service.ts` テスト → 実装
6. Route Handlers（detail, related, feedback）テスト → 実装
7. `app/components/` UI コンポーネントテスト → 実装
8. `app/(routes)/faqs/[faqId]/page.tsx` ページ組み立て・統合確認

**チェックリスト**:
- [ ] Repository: FAQ詳細取得（access_count +1 含む）実装・テスト完了
- [ ] Repository: 関連FAQ取得（JOIN、N+1 なし）実装・テスト完了
- [ ] Repository: フィードバック保存 実装・テスト完了
- [ ] Service: FAQ詳細・関連FAQ・フィードバック 実装・テスト完了
- [ ] Route Handler: `GET .../faqs/[faqId]` 完了
- [ ] Route Handler: `GET .../faqs/[faqId]/related` 完了
- [ ] Route Handler: `POST /api/faqs/[faqId]/feedback` 完了
- [ ] UI: FAQ詳細表示（タイトル・カテゴリ・本文マークダウン）実装
- [ ] UI: フィードバックボタン（選択状態変化・unsolved 時強調）実装
- [ ] UI: 関連FAQリスト（最大3件）実装
- [ ] UI: サポートデスク連絡先（常時表示・強調切り替え）実装
- [ ] UI: 「AIに詳しく聞く」ボタン（faqId を引き継いで P004 へ）実装
- [ ] P002 → P003 → 関連FAQ → P003 の遷移確認
- [ ] 統合テスト完了

---

## Phase 2: AIチャット機能

### 依存関係: Phase 1（Slice 1〜3）完了が前提

---

### Slice 4: AIチャット（P004）

**概要**: 入居者がテキストで自由に質問し、AIがマニュアルベースで即時回答する。未解決時はサポートデスクへフォールバックする。

**依存**: Slice 1（properties のサポートデスク）, Slice 3（P003 からの faqId 引き継ぎ）

**対象画面**: `app/(routes)/chat/page.tsx`（P004 AIチャット画面）

**Route Handlers（バック）**:
- `GET /api/question-suggestions` — 質問サジェスト取得（最大5件）
- `POST /api/chat/sessions` — チャットセッション作成（propertyId 必須）
- `POST /api/chat/sessions/[sessionId]/messages` — メッセージ送信・AI回答生成

**関連テーブル**: `question_suggestions`, `chat_sessions`, `chat_messages`, `faqs`（コンテキスト）, `properties`（フォールバック連絡先）

**AI実装方針**:
- `app/lib/llm/` の Open Responses API ラッパーを使用
- システムプロンプトに対象物件の FAQデータをコンテキストとして注入
- `faqId` 付き初回メッセージ時は該当 FAQ本文を追加コンテキストとして付与
- 2回目以降の `faqId` はサーバー側で無視
- AI が回答できないと判断した場合は `isUnresolved: true` を返す
- レスポンスに `relatedFaqs`（最大3件）を含める（Structured Output で型安全に取得）

**バリデーション**（Zod: `schemas/chat.schema.ts`）:
- `message` が200文字超過・空白のみ → `400 INVALID_MESSAGE`
- `sessionId` が存在しない → `404 SESSION_NOT_FOUND`

**シードデータ**: `question_suggestions` 5 件（Phase 0-3 に追加）

**実装順序（TDD）**:
1. `domain/repositories/question-suggestion.repository.ts` テスト → 実装
2. `domain/repositories/chat-session.repository.ts` テスト → 実装
3. `domain/repositories/chat-message.repository.ts` テスト → 実装
4. `app/lib/llm/chat.ts` Open Responses API ラッパー実装
5. `domain/services/chat.service.ts`（セッション作成・メッセージ送信・AI統合）テスト → 実装
6. Route Handlers（suggestions, sessions, messages）テスト → 実装
7. `app/components/` チャット UI コンポーネントテスト → 実装
8. `app/(routes)/chat/page.tsx` ページ組み立て・統合確認

**チェックリスト**:
- [ ] Repository: 質問サジェスト取得 実装・テスト完了
- [ ] Repository: チャットセッション作成 実装・テスト完了
- [ ] Repository: チャットメッセージ保存・取得 実装・テスト完了
- [ ] `app/lib/llm/chat.ts` Open Responses API ラッパー実装
- [ ] Service: 質問サジェスト 実装・テスト完了
- [ ] Service: チャットセッション作成 実装・テスト完了
- [ ] Service: メッセージ送信・AI回答生成（isUnresolved フォールバック含む）実装・テスト完了
- [ ] Service: faqId コンテキスト付与（初回のみ）テスト完了
- [ ] Route Handler: `GET /api/question-suggestions` 完了
- [ ] Route Handler: `POST /api/chat/sessions` 完了
- [ ] Route Handler: `POST /api/chat/sessions/[sessionId]/messages` 完了
- [ ] UI: チャット入力フォーム（送信・200文字バリデーション）実装
- [ ] UI: ユーザー吹き出し・AI吹き出し（マークダウン対応）実装
- [ ] UI: 質問サジェストチップ（初回のみ、タップで自動入力・送信）実装
- [ ] UI: 関連FAQリンク（AI吹き出し直下、最大3件）実装
- [ ] UI: サポートデスク連絡先バナー（AI未解決時）実装
- [ ] UI: ローディングインジケーター（AI応答待ち）実装
- [ ] P001/P002/P003 → P004 の遷移・faqId 引き継ぎ確認
- [ ] 統合テスト完了

---

## 依存関係マップ

```
Phase 0: Foundation（Slice 0-1 ～ 0-3）
  /foundation-project-setup  → Next.js + Supabase 接続確立
  /foundation-database-setup → 全テーブル作成
  /foundation-migration-seeder → シードデータ投入
            │
            ▼
Phase 1:
  Slice 1: ホーム画面（P001）
  ─ faq_categories / faqs（popular）Repository・Service・Route Handler
  ─ P001 UIコンポーネント
            │
            ▼
  Slice 2: FAQ検索（P002）
  ─ faqs（search: ilike）Repository・Service・Route Handler
  ─ P002 UIコンポーネント
            │
            ▼
  Slice 3: FAQ詳細・フィードバック（P003）
  ─ faqs（detail + access_count）/ related（JOIN）/ feedback
  ─ P003 UIコンポーネント
            │
            ▼
Phase 2:
  Slice 4: AIチャット（P004）
  ─ question_suggestions / chat_sessions / chat_messages
  ─ Open Responses API 統合（app/lib/llm/）
  ─ P004 UIコンポーネント
```

---

## アーキテクチャ参照

- **Vertical Slice Architecture（VSA）**: `.claude/rules/vsa-guide.md`
- **3レイヤードアーキテクチャ（Repository / Service / Route Handler）**: `.claude/rules/three-layer-architecture.md`
- **TDD ガイド**: `.claude/rules/tdd-guide.md`

---

## 次のステップ

1. **foundation エージェントで Phase 0 を実行してください**

   ```
   foundation エージェントで Foundation フェーズを開始してください
   ```

2. **Phase 0 完了後、fullstack-integration スキルで Slice 1 から順に実装**

   ```
   /fullstack-integration Slice 1: ホーム画面（P001）
   ```

---

生成日時: 2026-04-24
