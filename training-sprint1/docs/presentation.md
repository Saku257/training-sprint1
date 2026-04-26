# Sprint 1 振り返りレポート

**プロジェクト**: 三菱地所 テナントポータル MVP  
**期間**: Sprint 1  
**作成日**: 2026-04-26

---

## 1. 解いた課題

### 背景

三菱地所が管理する約200件の物件において、テナント入居者からの定型問い合わせが管理側の大きな負担になっていた。

| 課題 | 影響度 |
|------|--------|
| テナントマニュアルが画像中心・情報過多で検索性なし | 高 |
| 入居者が自己解決できず管理側に電話集中 | 高 |
| 担当者が定型対応に追われ本来業務に集中できない | 高 |

### ゴール

> **画像中心のテナントマニュアルをAI活用可能にし、入居者が24時間・人を介さずに自己解決できるポータルを構築する**

**KPI**: 定型問い合わせ件数および対応工数を導入前比50%以上削減

---

## 2. 作ったもの

### 画面構成（4画面）

| 画面ID | 画面名 | 主な機能 |
|--------|--------|---------|
| P001 | ホーム画面 | キーワード検索・カテゴリ選択・よく見られるFAQ・AIチャット起動 |
| P002 | 検索結果画面 | FAQキーワード検索・カテゴリフィルタ・本文抜粋表示 |
| P003 | FAQ詳細画面 | FAQ本文・関連FAQ・フィードバック（👍/👎） |
| P004 | AIチャット画面 | セッション管理・履歴表示・質問サジェスト |

### APIエンドポイント（9本）

```
GET  /api/properties/[propertyId]/faq-categories        FAQカテゴリ一覧
GET  /api/properties/[propertyId]/faqs/popular          よく見られるFAQ（上位5件）
GET  /api/properties/[propertyId]/faqs/search           FAQキーワード検索
GET  /api/properties/[propertyId]/faqs/[faqId]          FAQ詳細
GET  /api/properties/[propertyId]/faqs/[faqId]/related  関連FAQ
POST /api/faqs/[faqId]/feedback                         フィードバック送信
POST /api/chat/sessions                                 チャットセッション作成
POST /api/chat/sessions/[sessionId]/messages            メッセージ送信（AI回答）
GET  /api/question-suggestions                          質問サジェスト取得
```

### データベース（9テーブル）

```
properties          物件マスタ
faq_categories      FAQカテゴリ
faq_tags            FAQタグ
faqs                FAQ本体
faq_tag_mappings    FAQとタグのリレーション
feedback            フィードバック（👍/👎）
chat_sessions       チャットセッション
chat_messages       チャットメッセージ履歴
question_suggestions 質問サジェスト
```

---

## 3. 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js 14（App Router）+ React + Tailwind CSS |
| バックエンド | Next.js API Routes（Route Handlers） |
| データベース | Supabase（PostgreSQL） |
| LLM | Open Responses API（AIチャット） |
| バリデーション | Zod |
| テスト | Vitest + Testing Library |
| デプロイ | Vercel + Supabase |

### アーキテクチャ

3レイヤードアーキテクチャ（Vertical Slice Architecture）

```
Presentation Layer  (src/app/)
  └── Route Handlers / React Components / Server Actions

Business Logic Layer  (src/domain/services/)
  └── FaqService / ChatService / FeedbackService など

Data Access Layer  (src/domain/repositories/)
  └── FaqRepository / ChatRepository / FeedbackRepository など
```

---

## 4. テスト結果

| 種別 | テストファイル | テスト数 | 結果 |
|------|--------------|---------|------|
| API Route Tests | 7ファイル | 約60件 | ✅ ALL PASS |
| Service Tests | 5ファイル | 約20件 | ✅ ALL PASS |
| Repository Tests | 6ファイル | 約60件 | ✅ ALL PASS |
| Component Tests | 13ファイル | 約40件 | ✅ ALL PASS |
| **合計** | **33ファイル** | **183件** | **✅ 全件GREEN** |

---

## 5. 開発プロセス（TDD）

**Red → Green → Refactor** サイクルで全機能を実装

```
🔴 RED      失敗するテストを先に書く
    ↓
🟢 GREEN    テストを通す最小実装
    ↓
🔵 REFACTOR コード品質改善
```

各レイヤーごとに専門エージェントが担当：
- `repository-test-writer` / `repository-implementer`
- `service-test-writer` / `service-implementer`
- `api-test-writer` / `api-implementer`
- `component-test-writer` / `component-builder`

---

## 6. 実装中に直面した課題と解決

| 課題 | 解決策 |
|------|--------|
| Vitest v3 で `vi.fn<Args, Return>()` の型引数が2つから1つに変更 | `vi.fn<(arg: T) => R>()` の関数型シグネチャに修正 |
| `bodyExcerpt` のトランケートが80文字（テスト期待値は100文字） | `faq.repository.ts` の `substring(0, 80)` を `substring(0, 100)` に修正 |
| Zod v4 での UUID バリデーション変更（RFC 4122） | `z.string().uuid()` の挙動差異を把握しテスト調整 |

---

## 7. 成果物リポジトリ

- **GitHub**: `https://github.com/Saku257/training-sprint1`
- **ブランチ**: `main`
- **コミット数**: 5件（初期コミット → 設計ドキュメント → 実装一括コミット）

---

## 8. 次のステップ（Sprint 2 以降）

| 項目 | 内容 |
|------|------|
| 管理者画面 | FAQ登録・編集・削除のCRUD管理UI |
| 認証 | テナント別アクセス制御（Supabase Auth + RLS） |
| 画像対応 | テナントマニュアルPDF/画像のアップロード・OCR連携 |
| 分析ダッシュボード | 問い合わせ削減率・FAQ閲覧数の可視化 |
| 本番デプロイ | Vercel + Supabase 本番環境の構築 |
