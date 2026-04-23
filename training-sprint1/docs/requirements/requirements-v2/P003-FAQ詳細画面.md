# 要件定義書 v2: P003 FAQ詳細画面

> DB設計を踏まえた要件定義書の更新

## 目的

FAQの詳細な回答・手順を表示し、入居者がその場で問題を自己解決できる情報を提供する。解決できた場合はフィードバックを収集し、解決できなかった場合はAIチャット（P004）またはサポートデスクへの連絡先を常時提示して次のアクションへ迷わず進めるようにする。

## 機能

| # | 機能 | 説明 | v1からの変更点 |
|---|------|------|--------------|
| 1 | FAQ詳細表示 | 質問タイトル・カテゴリ・回答本文（テキスト・手順・画像）を表示する | DB関連テーブル: `faqs`（READ by id）、`faq_categories`（JOIN: カテゴリ名取得） |
| 2 | 解決フィードバック | 「解決できた / できなかった」を入居者が回答し、満足度データを収集する | DB関連テーブル: `feedback`（CREATE: faq_id・value・submitted_at を保存）、`faqs`（access_count は別途集計で更新） |
| 3 | AIチャットへの誘導 | 「AIに詳しく聞く」ボタンからP004へ遷移し、現在のFAQコンテキストを引き継ぐ | DB関連テーブル: なし（FAQ IDをURLパラメータとして渡すのみ） |
| 4 | サポートデスク連絡先表示 | 電話番号・問い合わせフォームリンクをページ下部に常時表示し、「解決できなかった」選択時は強調表示に切り替える | DB関連テーブル: `properties`（READ: property_id に紐づく support_phone・support_form_url を取得） |
| 5 | 関連FAQ表示 | 関連する他のFAQを最大3件表示し、P003内で別FAQへ遷移できる | DB関連テーブル: `faq_tag_mappings`（READ: 同一タグを持つFAQ IDを取得）、`faqs`（READ: 関連FAQ title 取得） |

## Input / Process / Output

| 機能 | Input | Process | Output | DB関連テーブル |
|------|-------|---------|--------|--------------|
| FAQ詳細表示 | FAQ ID（URLパラメータ） | `faqs` を id で取得し、`faq_categories` を JOIN してカテゴリ名を取得。回答本文のマークダウンをHTMLへ変換 | タイトル・カテゴリタグ・回答本文（テキスト・番号付き手順・画像）の表示 | `faqs` READ, `faq_categories` JOIN |
| 解決フィードバック | 「解決できた / できなかった」選択（タップ） | `feedback` テーブルへ faq_id・value（solved/unsolved）・submitted_at を INSERT | 選択ボタンのハイライト変化。「解決できなかった」選択時はサポートデスク連絡先を強調表示に切り替え | `feedback` CREATE |
| AIチャットへの誘導 | タップ操作 | 現在のFAQ IDをURLパラメータとしてP004へルーティング | P004（AIチャット画面）への遷移。FAQ IDをコンテキストとして引き継ぎ | なし |
| サポートデスク連絡先表示 | ページロード時（常時表示） | FAQ IDに紐づく `faqs.property_id` から `properties` テーブルの support_phone・support_form_url を取得 | 電話番号（タップでOS電話アプリ起動）・問い合わせフォームURL（外部リンク）をページ下部に常時表示 | `properties` READ（`faqs` JOIN） |
| 関連FAQ表示 | FAQ ID（ページロード時） | `faq_tag_mappings` で現在のFAQのタグIDを取得 → 同タグを持つ他の FAQ IDを検索（自身を除く、最大3件） → `faqs` で title を取得 | 関連FAQのタイトルリンクリスト（最大3件） | `faq_tag_mappings` READ, `faq_tags` JOIN, `faqs` READ |

## UI状態遷移

| 要素 | 対応機能 | DB関連テーブル |
|------|---------|--------------|
| FAQ本文 | FAQ詳細表示 | `faqs`・`faq_categories`（ページロード時に取得。ローディング→表示→エラーを切り替え） |
| フィードバックボタン（解決できた） | 解決フィードバック | `feedback`（タップ時にINSERT。送信完了後はボタンを固定・再タップ不可） |
| フィードバックボタン（解決できなかった） | 解決フィードバック | `feedback`（タップ時にINSERT。送信完了後はボタンを固定・サポートデスク連絡先を強調表示） |
| サポートデスク連絡先 | サポートデスク連絡先表示 | `properties`（ページロード時に取得。常時表示→強調表示を切り替え） |
| 関連FAQリスト | 関連FAQ表示 | `faq_tag_mappings`・`faqs`（ページロード時に取得。ローディング→表示→非表示を切り替え） |
| 「AIに詳しく聞く」ボタン | AIチャットへの誘導 | なし |

---

## 次のステップ

→ `/design-api` でAPI設計書を作成する
