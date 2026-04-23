# API設計書

> DB設計・要件定義書v2・IPO一覧から作成。P001〜P004（入居者向けテナントポータル）が対象。

## 設計方針

- REST 原則に基づくリソース中心の設計
- ベースパス: `/api`
- レスポンス形式: JSON
- 物件単位のスコープは URL パスの `:propertyId` で表現
- 日時フォーマット: ISO 8601（例: `2026-04-23T10:00:00Z`）

---

## API一覧

| # | エンドポイント | メソッド | 機能 | 対応テーブル |
|---|--------------|---------|------|------------|
| 1 | `/api/properties/:propertyId/faq-categories` | GET | FAQカテゴリ一覧取得 | `faq_categories` |
| 2 | `/api/properties/:propertyId/faqs/popular` | GET | よく見られるFAQ取得 | `faqs` |
| 3 | `/api/properties/:propertyId/faqs/search` | GET | FAQ検索（キーワード・カテゴリ） | `faqs`, `faq_categories` |
| 4 | `/api/properties/:propertyId/faqs/:faqId` | GET | FAQ詳細取得（サポートデスク連絡先含む） | `faqs`, `faq_categories`, `properties` |
| 5 | `/api/properties/:propertyId/faqs/:faqId/related` | GET | 関連FAQ取得 | `faq_tag_mappings`, `faq_tags`, `faqs` |
| 6 | `/api/faqs/:faqId/feedback` | POST | フィードバック送信 | `feedback` |
| 7 | `/api/question-suggestions` | GET | 質問サジェスト取得 | `question_suggestions` |
| 8 | `/api/chat/sessions` | POST | チャットセッション作成 | `chat_sessions` |
| 9 | `/api/chat/sessions/:sessionId/messages` | POST | メッセージ送信・AI回答生成 | `chat_messages`, `faqs`, `properties` |

---

## 認証・認可

| 項目 | 内容 |
|------|------|
| 認証方式 | なし（MVP では入居者認証不要。`propertyId` を知っていれば利用可能） |
| アクセス制御 | URL パスの `propertyId` による物件スコープ制限。別物件のリソースへのアクセスはサーバー側で拒否（404を返す） |
| 将来対応 | 管理者APIは Sprint 2 以降で JWT 認証を追加予定 |

---

## 共通エラーレスポンス形式

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーの説明（日本語）"
  }
}
```

| ステータス | 用途 |
|-----------|------|
| 400 | バリデーションエラー（文字数超過・空白のみ入力など） |
| 404 | リソースが存在しない |
| 500 | サーバー内部エラー |

---

## エンドポイント詳細

---

### 1. FAQカテゴリ一覧取得

- **Method**: GET
- **Path**: `/api/properties/:propertyId/faq-categories`
- **目的**: P001 のカテゴリカード描画用に、物件に紐づくFAQカテゴリの一覧を取得する
- **対応テーブル**: `faq_categories`

#### リクエスト

| パラメータ | 場所 | 型 | 必須 | 説明 |
|-----------|------|----|------|------|
| propertyId | path | string（UUID） | Yes | 対象物件のID |

**リクエスト例**:
```
GET /api/properties/a1b2c3d4-0000-0000-0000-000000000001/faq-categories
```

#### レスポンス（成功 200）

```json
{
  "success": true,
  "data": [
    {
      "id": "cat-uuid-001",
      "name": "設備",
      "icon": "wrench"
    },
    {
      "id": "cat-uuid-002",
      "name": "ゴミ出し",
      "icon": "trash"
    }
  ]
}
```

#### レスポンス（エラー）

| ステータス | 意味 | エラーコード |
|-----------|------|------------|
| 404 | 指定の propertyId が存在しない | `PROPERTY_NOT_FOUND` |
| 500 | サーバーエラー | `INTERNAL_SERVER_ERROR` |

---

### 2. よく見られるFAQ取得

- **Method**: GET
- **Path**: `/api/properties/:propertyId/faqs/popular`
- **目的**: P001 の「よく見られるFAQ」リスト描画用に、アクセス数上位のFAQを取得する
- **対応テーブル**: `faqs`

#### リクエスト

| パラメータ | 場所 | 型 | 必須 | 説明 |
|-----------|------|----|------|------|
| propertyId | path | string（UUID） | Yes | 対象物件のID |
| limit | query | integer | No | 取得件数（デフォルト: 5、最大: 10） |

**リクエスト例**:
```
GET /api/properties/a1b2c3d4-.../faqs/popular?limit=5
```

#### レスポンス（成功 200）

```json
{
  "success": true,
  "data": [
    {
      "id": "faq-uuid-001",
      "title": "エアコンの使い方を教えてください",
      "categoryName": "設備"
    }
  ]
}
```

#### レスポンス（エラー）

| ステータス | 意味 | エラーコード |
|-----------|------|------------|
| 404 | 指定の propertyId が存在しない | `PROPERTY_NOT_FOUND` |
| 500 | サーバーエラー | `INTERNAL_SERVER_ERROR` |

---

### 3. FAQ検索

- **Method**: GET
- **Path**: `/api/properties/:propertyId/faqs/search`
- **目的**: P002 の検索結果一覧表示用に、キーワードまたはカテゴリIDでFAQを検索する
- **対応テーブル**: `faqs`, `faq_categories`

#### リクエスト

| パラメータ | 場所 | 型 | 必須 | 説明 |
|-----------|------|----|------|------|
| propertyId | path | string（UUID） | Yes | 対象物件のID |
| q | query | string（最大50文字） | No | 検索キーワード。`categoryId` と排他。空白のみ不可 |
| categoryId | query | string（UUID） | No | カテゴリID。`q` と排他 |

**バリデーション**: `q` と `categoryId` のどちらか一方が必須。両方指定した場合は `q` を優先。

**リクエスト例**:
```
GET /api/properties/a1b2c3d4-.../faqs/search?q=エアコン
GET /api/properties/a1b2c3d4-.../faqs/search?categoryId=cat-uuid-001
```

#### レスポンス（成功 200）

```json
{
  "success": true,
  "data": {
    "total": 3,
    "items": [
      {
        "id": "faq-uuid-001",
        "title": "エアコンの使い方を教えてください",
        "bodyExcerpt": "エアコンのリモコンは...",
        "categoryName": "設備"
      }
    ]
  }
}
```

#### レスポンス（エラー）

| ステータス | 意味 | エラーコード |
|-----------|------|------------|
| 400 | キーワードが50文字超過または空白のみ | `INVALID_SEARCH_QUERY` |
| 404 | 指定の propertyId が存在しない | `PROPERTY_NOT_FOUND` |
| 500 | サーバーエラー | `INTERNAL_SERVER_ERROR` |

---

### 4. FAQ詳細取得

- **Method**: GET
- **Path**: `/api/properties/:propertyId/faqs/:faqId`
- **目的**: P003 のFAQ詳細画面表示用に、FAQ本文・カテゴリ情報・サポートデスク連絡先を一括取得する
- **対応テーブル**: `faqs`, `faq_categories`, `properties`
- **副作用**: レスポンス返却時に対象FAQの `faqs.access_count` を +1 する（同期更新）。これにより API #2「よく見られるFAQ」のランキングが反映される

#### リクエスト

| パラメータ | 場所 | 型 | 必須 | 説明 |
|-----------|------|----|------|------|
| propertyId | path | string（UUID） | Yes | 対象物件のID |
| faqId | path | string（UUID） | Yes | 取得するFAQのID |

**リクエスト例**:
```
GET /api/properties/a1b2c3d4-.../faqs/faq-uuid-001
```

#### レスポンス（成功 200）

```json
{
  "success": true,
  "data": {
    "id": "faq-uuid-001",
    "title": "エアコンの使い方を教えてください",
    "body": "## 操作手順\n\n1. リモコンの電源ボタンを...",
    "categoryName": "設備",
    "updatedAt": "2026-04-01T09:00:00Z",
    "supportDesk": {
      "phone": "03-1234-5678",
      "formUrl": "https://example.com/contact"
    }
  }
}
```

#### レスポンス（エラー）

| ステータス | 意味 | エラーコード |
|-----------|------|------------|
| 404 | 指定の FAQ または物件が存在しない / 非公開 | `FAQ_NOT_FOUND` |
| 500 | サーバーエラー | `INTERNAL_SERVER_ERROR` |

---

### 5. 関連FAQ取得

- **Method**: GET
- **Path**: `/api/properties/:propertyId/faqs/:faqId/related`
- **目的**: P003 の関連FAQリスト描画用に、同一タグを持つ他のFAQを最大3件取得する
- **対応テーブル**: `faq_tag_mappings`, `faq_tags`, `faqs`
- **クエリ設計**: `faq_tag_mappings`・`faq_tags`・`faqs` の3テーブルを JOIN（または ORM の Eager Load）し、**1回のクエリ**でデータを取得する。ループ処理による個別クエリ発行（N+1問題）は禁止

#### リクエスト

| パラメータ | 場所 | 型 | 必須 | 説明 |
|-----------|------|----|------|------|
| propertyId | path | string（UUID） | Yes | 対象物件のID |
| faqId | path | string（UUID） | Yes | 基準となるFAQのID |
| limit | query | integer | No | 取得件数（デフォルト: 3、最大: 5） |

**リクエスト例**:
```
GET /api/properties/a1b2c3d4-.../faqs/faq-uuid-001/related
```

#### レスポンス（成功 200）

```json
{
  "success": true,
  "data": [
    {
      "id": "faq-uuid-002",
      "title": "エアコンのフィルター清掃方法"
    }
  ]
}
```

#### レスポンス（エラー）

| ステータス | 意味 | エラーコード |
|-----------|------|------------|
| 404 | 指定の FAQ または物件が存在しない | `FAQ_NOT_FOUND` |
| 500 | サーバーエラー | `INTERNAL_SERVER_ERROR` |

---

### 6. フィードバック送信

- **Method**: POST
- **Path**: `/api/faqs/:faqId/feedback`
- **目的**: P003 の「解決できた / できなかった」フィードバックを受け取り `feedback` テーブルへ保存する
- **対応テーブル**: `feedback`

#### リクエスト

| パラメータ | 場所 | 型 | 必須 | 説明 |
|-----------|------|----|------|------|
| faqId | path | string（UUID） | Yes | フィードバック対象のFAQ ID |
| value | body | string | Yes | `"solved"` または `"unsolved"` |

**リクエスト例**:
```json
POST /api/faqs/faq-uuid-001/feedback
{
  "value": "solved"
}
```

#### レスポンス（成功 201）

```json
{
  "success": true,
  "data": {
    "id": "feedback-uuid-001",
    "faqId": "faq-uuid-001",
    "value": "solved",
    "submittedAt": "2026-04-23T10:30:00Z"
  }
}
```

#### レスポンス（エラー）

| ステータス | 意味 | エラーコード |
|-----------|------|------------|
| 400 | `value` が `solved` / `unsolved` 以外 | `INVALID_FEEDBACK_VALUE` |
| 404 | 指定のFAQが存在しない | `FAQ_NOT_FOUND` |
| 500 | サーバーエラー | `INTERNAL_SERVER_ERROR` |

---

### 7. 質問サジェスト取得

- **Method**: GET
- **Path**: `/api/question-suggestions`
- **目的**: P004 チャット開始時のサジェストチップ描画用に、よく聞かれる質問を取得する
- **対応テーブル**: `question_suggestions`

#### リクエスト

| パラメータ | 場所 | 型 | 必須 | 説明 |
|-----------|------|----|------|------|
| limit | query | integer | No | 取得件数（デフォルト: 5、最大: 5） |

**リクエスト例**:
```
GET /api/question-suggestions?limit=5
```

#### レスポンス（成功 200）

```json
{
  "success": true,
  "data": [
    { "id": "sug-uuid-001", "text": "エアコンの使い方を教えてください" },
    { "id": "sug-uuid-002", "text": "ゴミの出し方が分かりません" }
  ]
}
```

#### レスポンス（エラー）

| ステータス | 意味 | エラーコード |
|-----------|------|------------|
| 500 | サーバーエラー | `INTERNAL_SERVER_ERROR` |

---

### 8. チャットセッション作成

- **Method**: POST
- **Path**: `/api/chat/sessions`
- **目的**: P004 の AIチャット画面ロード時に新しいチャットセッションを作成し、セッションIDを払い出す
- **対応テーブル**: `chat_sessions`

#### リクエスト

| パラメータ | 場所 | 型 | 必須 | 説明 |
|-----------|------|----|------|------|
| propertyId | body | string（UUID） | Yes | 対象物件のID |

**リクエスト例**:
```json
POST /api/chat/sessions
{
  "propertyId": "a1b2c3d4-0000-0000-0000-000000000001"
}
```

#### レスポンス（成功 201）

```json
{
  "success": true,
  "data": {
    "sessionId": "session-uuid-001",
    "startedAt": "2026-04-23T10:00:00Z"
  }
}
```

#### レスポンス（エラー）

| ステータス | 意味 | エラーコード |
|-----------|------|------------|
| 404 | 指定の propertyId が存在しない | `PROPERTY_NOT_FOUND` |
| 500 | サーバーエラー | `INTERNAL_SERVER_ERROR` |

---

### 9. メッセージ送信・AI回答生成

- **Method**: POST
- **Path**: `/api/chat/sessions/:sessionId/messages`
- **目的**: P004 のユーザー質問を受け取り、AIがマニュアルをもとに回答を生成してチャットメッセージとして保存・返却する。AI未解決時はフォールバックフラグを立てる
- **対応テーブル**: `chat_messages`, `faqs`（コンテキスト取得用）, `properties`（フォールバック時の連絡先取得）

#### リクエスト

| パラメータ | 場所 | 型 | 必須 | 説明 |
|-----------|------|----|------|------|
| sessionId | path | string（UUID） | Yes | チャットセッションのID |
| message | body | string（最大200文字、空白のみ不可） | Yes | ユーザーの質問テキスト |
| faqId | body | string（UUID） | No | P003から遷移した場合のFAQ ID（追加コンテキスト）。**セッションの初回メッセージ送信時のみ有効**。2回目以降のメッセージに付与された場合はサーバー側で無視する |

**リクエスト例**:
```json
POST /api/chat/sessions/session-uuid-001/messages
{
  "message": "エアコンから水が漏れています。どうすればいいですか？",
  "faqId": "faq-uuid-001"
}
```

#### レスポンス（成功 200）

```json
{
  "success": true,
  "data": {
    "userMessage": {
      "id": "msg-uuid-001",
      "type": "user",
      "body": "エアコンから水が漏れています。どうすればいいですか？",
      "sentAt": "2026-04-23T10:05:00Z"
    },
    "aiMessage": {
      "id": "msg-uuid-002",
      "type": "ai",
      "body": "## エアコン水漏れの対処手順\n\n1. まず電源をオフにしてください...",
      "isUnresolved": false,
      "relatedFaqs": [
        { "id": "faq-uuid-003", "title": "エアコンのフィルター清掃方法" }
      ],
      "sentAt": "2026-04-23T10:05:02Z"
    },
    "supportDesk": null
  }
}
```

**AI未解決時のレスポンス例**（`isUnresolved: true` の場合）:

```json
{
  "success": true,
  "data": {
    "userMessage": { ... },
    "aiMessage": {
      "id": "msg-uuid-002",
      "type": "ai",
      "body": "申し訳ありません。この質問にはお答えできません。サポートデスクにお問い合わせください。",
      "isUnresolved": true,
      "relatedFaqs": [],
      "sentAt": "2026-04-23T10:05:02Z"
    },
    "supportDesk": {
      "phone": "03-1234-5678",
      "formUrl": "https://example.com/contact"
    }
  }
}
```

#### レスポンス（エラー）

| ステータス | 意味 | エラーコード |
|-----------|------|------------|
| 400 | メッセージが200文字超過または空白のみ | `INVALID_MESSAGE` |
| 404 | 指定の sessionId が存在しない | `SESSION_NOT_FOUND` |
| 500 | サーバーエラー / AI API タイムアウト | `INTERNAL_SERVER_ERROR` |
