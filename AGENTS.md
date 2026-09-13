## プロジェクト概要 / Overview
本PJは、病院やクリニックで臨床工学技士（もしくは医療スタッフ）が医療機器の管理およびその点検記録管理をペーパーレスで完遂できるようにするWEBアプリケーションです。
- **フレームワーク**: Nuxt3 モノリス
- **データベース**: PostgreSQL(Neon)
- **主要ライブラリ**: vuetify、nuxt-security、@sidebase/nuxt-auth、jsonwebtoken、date-fns、resend、wanakana、xlsx
- **環境設定**: 環境変数は `.env` ファイルで管理（機密情報はコードに直書きしない）

## 開発環境セットアップ / Development Setup
1. 依存関係のインストール
   ```bash
   npm install --legacy-peer-deps
   ```
   `--legacy-peer-deps`が必要な理由：`@sidebase/nuxt-auth`→`next-auth`のpeer依存や、`drizzle-orm`のoptional peer（react-native向けSQLiteドライバ）が、本PJでは使わないパッケージと衝突するため。実害はない。
2. `.env`ファイルをプロジェクトルートに作成し、以下の環境変数を設定する
   - `DATABASE_URL` / `PGHOST` / `PGPORT` / `PGDATABASE` / `PGUSER` / `PGPASSWORD`：Neon PostgreSQLの接続情報
   - `SECRET_KEY`：JWT署名用の秘密鍵
   - `NUXT_PUBLIC_RECAPTCHA_SITEKEY` / `RECAPTCHA_SECRET_KEY`：reCAPTCHA
   - `RESEND_API_KEY` / `EMAIL_SERVICE_USER` / `EMAIL_SERVICE_OWNER`：メール送信（Resend）
   - `FRONTEND_URL` / `NODE_ENV`
3. 開発サーバー起動
   ```bash
   npm run dev
   ```
   `http://localhost:3000`で起動する。

## テストの実行方法 / Testing
サーバーサイド（Hono middleware等）のテストにはVitestを使用する。
```bash
npm run test
```
Vue側（frontend）のテストは現時点で未整備。

## コードスタイル / Code Style
- フォーマッター、リンター: **Biome** を使用（`npx biome check --write .` でソースコードを整形・import整理）
- ブランチ名は <type>/<内容をkebab-case> とし、typeはConventional Commitsのtype語彙（feat/fix/chore/refactor/docsなど）から選ぶ。
    -  例: feat/add-login-form


## セキュリティ方針 / Security
- **秘密情報は厳重に管理**: APIキーやパスワードなど秘密情報は`.env`や環境変数から読み込み、絶対にGitに含めない

## Commit & Push
- 指示もなく勝手にCommitやPushをしない。明示的に「Commitして」と言われた時のみ実行する。
- 基本的に、1 PR(push) = 1 issue とする
- 実装とテストは別Commitとする
- Commit時のタイトルは、Conventional Commitsに準拠する
    - 例）<type>(対象レイヤー、apiやwebなど): < 日本語で一行で完結にまとめる >
    - 例）大きなPJのissueの場合は、「<type>(対象レイヤー/PJの略):~」
- 詳細な内容は箇条書きで、日本語で簡潔にまとめる。AIのシグネチャは含まない
- commitの指示があった場合は、Commitメッセージの草案、`git add`、までとする。

## 参考文献
FWもしくはライブラリについて調べる際は、以下のような公式ソースをベースに検討すること。
- Nuxt:https://nuxt.com/docs/3.x/getting-started/introduction
- Hono:https://hono.dev/docs/
- drizzle ORM:https://orm.drizzle.team/docs/overview
- zod:https://zod.dev/
- nuxt-security:https://nuxt-security.vercel.app/getting-started/installation