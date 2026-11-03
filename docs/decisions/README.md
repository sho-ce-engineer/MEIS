# Architecture Decision Records（ADR）

本PJの設計判断を記録する場所。フォーマットは [MADR 4.0.0](https://adr.github.io/madr/) のminimal版をベースにする（[ADR-0000](0000-use-madr.md)）。

## ADRを書く基準

「後から見て『なぜこうなっているのか』と疑問に思われる判断」を書く。

**書く**
- 技術・ライブラリ・外部サービスの採用・置き換え（例：Hono、drizzle、Resendの採用）
- アーキテクチャ・レイヤー構成・責務分担の方針（例：Clean Architecture、Container/Presentational）
- データモデル・DBスキーマの大きな方針
- 認証・認可・セキュリティの方針
- 複数PR・複数ファイルに影響する規約
- 一度決めたADRの方針を変えるとき

**書かない**
- 1つのPRの中で完結する実装上の判断（→ PR descriptionに書く）
- バグ修正、依存パッケージの更新
- コードを読めば理由がわかるもの

迷ったら書く。短くてよい。

## ファイル

- 置き場所：`docs/decisions/`
- ファイル名：`NNNN-<内容をkebab-case>.md`
  - `NNNN`は4桁の連番（`0001`, `0002`, ...）。既存の最大番号+1を使う
  - 欠番・番号の再利用はしない
  - 例：`0001-use-hono-for-server-v2.md`
- テンプレート：[adr-template.md](adr-template.md) をコピーして使う

## フォーマット

| 項目 | 必須 | 内容 |
| --- | --- | --- |
| `status`（frontmatter） | ○ | 下記ステータスのいずれか |
| `date`（frontmatter） | ○ | 最後にステータスを変えた日（日本時間、`YYYY-MM-DD`） |
| タイトル（`#`） | ○ | 問題と解決策がわかる短い一文。日本語 |
| 背景と課題 | ○ | 背景と課題を2〜3文。関連issue/PRのリンク |
| 検討した選択肢 | ○ | 検討した選択肢。採用案を含めて2つ以上（「何もしない」も選択肢になる） |
| 決定 | ○ | `採用案：「...」。理由：...` の形で採用案と理由 |
| 影響 | 任意 | 良くなること（良い点）と、受け入れたトレードオフ（悪い点） |

- 見出し・本文とも日本語で書く（MADRの見出しとの対応は下表）
- 1つのADRには1つの判断だけを書く
- 上記以外のMADR標準の項目（判断の決め手、選択肢ごとの長所と短所、確認方法、補足情報）は、必要なときだけ追加してよい

| 本PJの見出し | MADRの見出し | minimal版に含む |
| --- | --- | --- |
| 背景と課題 | Context and Problem Statement | ○ |
| 判断の決め手 | Decision Drivers | |
| 検討した選択肢 | Considered Options | ○ |
| 決定 | Decision Outcome | ○ |
| 影響 | Consequences | ○ |
| 確認方法 | Confirmation | |
| 選択肢ごとの長所と短所 | Pros and Cons of the Options | |
| 補足情報 | More Information | |

## ステータス

| status | 意味 |
| --- | --- |
| `proposed` | 提案中（PRレビュー中） |
| `accepted` | 採用済み |
| `rejected` | 検討したが採用しなかった |
| `deprecated` | 廃止された（置き換え先なし） |
| `superseded by ADR-NNNN` | 別のADRに置き換えられた |

## 運用ルール

1. **ADRは関連する実装と同じPRに含める**。`proposed`で作成し、マージ前に`accepted`へ変更する。実装より先に方針だけを決めたい場合は、ADR単体のPRでもよい
2. **`accepted`になったADRの本文は書き換えない**。誤字修正とリンク切れの修正だけは可
3. **方針を変えるときは新しいADRを書く**。新しいADRに置き換え元（`ADR-NNNN`）へのリンクを書き、古いADRは`status`を`superseded by ADR-NNNN`に、`date`を変更日に更新する（本文はそのまま残す）
4. **ADRを追加・ステータス変更したら、下記の一覧も更新する**
5. ADRとPR descriptionの使い分け
   - ADR：PJ全体に長く効く判断の理由
   - PR description：そのPRの変更内容と、PR内で完結する設計意図。関連するADRがあればリンクする

## AIエージェント向け

- 設計・アーキテクチャに関わる変更を行う前に、`accepted`のADRを確認する
- `accepted`のADRと矛盾する実装はしない。矛盾が必要な場合は、実装前にユーザーへ確認し、新しいADRを提案する
- 上記「ADRを書く基準」に当てはまる変更を行う場合は、ADRの草案（`proposed`）を作成する

## 一覧

| No. | タイトル | status | date |
| --- | --- | --- | --- |
| [0000](0000-use-madr.md) | 設計判断の記録にMADR（minimal版）を使う | accepted | 2026-11-02 |
