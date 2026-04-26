# Training Sprint 1

## プロジェクト説明

R2B 研修システムの Slice 実装用リポジトリ

## プロジェクト構造

- `src/app/` : UI コンポーネント・ページ（Presentation Layer）
- `src/domain/` : ビジネスロジック層・データアクセス層
  - `models/` : ドメインモデル型定義
  - `services/` : ビジネスロジック
  - `repositories/` : Data Access Layer
- `src/schemas/` : Zod バリデーションスキーマ
- `src/types/` : 共通型定義
- `src/lib/` : ユーティリティ関数
- `__tests__/` : テストファイル

## セットアップ

```bash
npm install
npm run dev
```

## 開発コマンド

- `npm run dev`: 開発サーバー起動
- `npm run build`: ビルド
- `npm run lint`: Lint 実行
- `npm test`: テスト実行
