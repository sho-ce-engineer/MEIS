# server/v2 コーディング規約

## 命名規則

### 型・インターフェース
- PascalCase
- パラメータ用インターフェースは `関数名 + Params` とする
  - 例：`listEquipmentTypes` の引数型 → `ListEquipmentTypeParams`

### 変数・関数
- camelCase
- 一覧取得は `list〇〇`、単一取得は `get〇〇`、追加は `add〇〇`、更新は `update〇〇`、削除は `delete〇〇` で始める
  - 既存例：`listEquipmentTypes`、`listInspectionItemDetails`、`addInspectionItem`、`updateInspectionItem`、`deleteInspectionItem`

### Zodスキーマ（`domain.ts`）
- 変数名は `動詞 + 対象 + RequestSchema`
  - 例：`listEquipmentTypesRequestSchema`、`updateInspectionItemRequestSchema`

## ファイル構成
- 1エンドポイント1ディレクトリ、中身は`service.ts`（必須）・`domain.ts`（入力検証が必要な場合のみ）
- ディレクトリ名は `動詞 + 対象`（kebab-case）
  - 例：`list-users`、`update-role`、`delete-user`
- ルーティング定義（`router.ts`）は機能ドメイン単位の親ディレクトリに集約し、エンドポイントごとに個別の`router.ts`は作らない
  - 例：`equipment/router.ts`が`/types`・`/manufacturer`・`/id`をまとめて持つ。`equipment/types/router.ts`のような分散は作らない
- URLパス（`router.ts`で定義するパス）は対象を表す名詞のみとし、動詞を含めない。動詞の意味合いはHTTPメソッドが担う
  - 例：`GET /users`（一覧取得だがパスは名詞）
  - 例外：`/api/v2/auth/*`は`@sidebase/nuxt-auth`（authjs provider）のNuxtAuthHandler（`server/api/v2/auth/[...].ts`）が受け持つため、Honoのルートを定義しない
- テストは実装と同じ階層に`xxx.test.ts`
  - `service.ts` → `service.test.ts`（DB層のモック、`vi.mock('~/server/db', ...)`）
  - 親`router.ts` → `router.test.ts`（service層のモック、`app.request()`でHTTP経由のテスト）

## 日付・日時
- DBの日付・日時の列は、すべて`timestamptz`（Drizzleでは`timestamp(…, { withTimezone: true, mode: 'string' })`）とする。`date`型は使わない
- 日付だけの値（購入日など）は、日本時間のその日の0時として保存する
  - 時差の付いた日時（例：`2026-10-14T15:00:00.000Z`）は、その時点のまま保存する
  - 時差の無い日付（例：`2026-10-15`）は、受け取るときに日本時間の0時に直す
- 日付だけを返すときは、`formatInTimeZone(value, 'Asia/Tokyo', 'yyyy-MM-dd')`で日本時間の日付に直して返す
