---
status: accepted
date: 2026-11-02
---

# 設計判断の記録にMADR（minimal版）を使う

## 背景と課題

設計判断の理由は、これまでPR descriptionに書いてきた。しかしPRは後から探しにくく、判断が後のPRで覆ったかどうかも追えない。AIエージェントが既存の設計方針を把握する手段もない。設計判断を、リポジトリ内で探せる形でどう残すか？

## 検討した選択肢

* MADR（minimal版）
* Nygard形式のADR
* PR descriptionだけで残す（現状維持）

## 決定

採用案：「MADR（minimal版）」。理由：「検討した選択肢」を項目として持つため、MEISのように他の選択肢と比べて決めた判断が多いPJで理由を残しやすい。そのうえで、minimal版なら書く負担はNygard形式と大差ない。

### 影響

* 良い点：設計判断が`docs/decisions/`に集まり、人もAIエージェントも参照できる
* 良い点：判断が覆ったとき、Supersededで履歴を追える
* 悪い点：PR descriptionに加えてADRを書く手間が増える
* 悪い点：見出しを日本語にし、minimal版にない`status`/`date`のメタデータを足しているため、MADRの標準形そのままではない（MADR向けツールはそのままでは使えない場合がある）
