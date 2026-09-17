---
name: life-issue
description: LIFE ISSUES の次号を発行する。「issueをまとめて」「次号を書いて」「life issue」で起動。前号からの差分（つくったもの・読んだもの・AIの提案）を集め、85memo の文脈を踏まえて WHY と NEXT QUESTION を下書きし、本人の OK 後にだけ公開する。
---

# LIFE ISSUES 発行

サイトは LIFE ISSUES → INPUT → OUTPUT → LIFE ISSUES の循環でできている。
この Skill はその一周を閉じる。前号の問いに対して、この期間に何をつくり、
何を読み、どう考えが動いたかをまとめ、次の問いを立てる。

## 守ること

- このリポジトリは public。`content/` に書く = 公開。AGENTS.md の規約に従う
- MCP `memo` は **`space: "85memo"` だけ**を読む。nachimemo は勤務先の情報なので読まない
- メモの本文を `why` にコピーしない。メモは「今週なにが起きたか」を知るための判断材料で、
  `why` は本人の言葉として書き直す
- 公開は本人の OK 後だけ。OK の前に `--confirmed-in-project-chat` を付けない
- `draft.json` に無い URL を作らない

## 手順

### 1. 前号を読む

`content/life-issues/issues/` の最大番号が前号。`nextQuestion`、`why`、`periodEnd` を控える。
今号は前号の `nextQuestion` への応答として書く。

### 2. 素材を更新する

```bash
npm run aggregate          # GitHub / note.com / Zenn / Bluesky を再集約し draft.json を作り直す
npm run reading:sync       # Pi 上のみ。読書リストの既読/未読を取り込む
```

`.env.local` に `GEMINI_API_KEY` が無いと要約が生の文章のまま入る。無ければ
`npm run life-issue:draft` だけ実行し、既存の `summarized.json` から下書きを作る。

`content/life-issues/draft.json` を読み、`issue` が前号 +1 であること、
`periodStart`〜`periodEnd` が前号の `periodEnd` の後を覆っていることを確認する。
期間をずらすときは `LIFE_ISSUE_END_DATE=YYYY-MM-DD npm run life-issue:draft`。

### 3. 差分を集める

- **MADE / FOUND**: `draft.json` の自動選出。定型コミットが混ざっていたら `made` を手で入れ替える
  （`content/research/summarized.json` にある項目だけ使う）
- **読んだもの**: `git diff content/research/reading.json` で `done` が変わった項目
- **AI の提案**: `content/research/suggested.json`（published のものだけが INPUT に出ている）
- **本人の文脈**: MCP `memo` で 85memo を読む
  - `list_journal`（`space: "85memo"`、期間内）— 日報の振り返り
  - `list_tasks`（`space: "85memo"`、完了分）— 何を終えたか
  - 必要なら `read_note` で Projects 配下

集めたものは、チャットには要点だけ書く。

### 4. WHY と NEXT QUESTION を下書きする

- `why`: **100〜200字**（ローダーが検証する）。1号は本人の箇条書き（「- LINEを辞める」の形）。
  文体は前号に合わせる。前号の問いに対して今週どう動いたか、が芯
- `nextQuestion`: 1文。前号と同じままでもよい。変えるなら、変えた理由を `why` に含める

下書きを本人に見せ、修正を受ける。ここで止まる。

### 5. OK が出たら公開する

```bash
# draft.json の why / nextQuestion に確定文を書き込む（Edit で直接）
npm run life-issue:publish -- --confirmed-in-project-chat   # 検証して issues/NNN.json を書く
npm run check:disclosure
npx tsc --noEmit
git add content/life-issues && git commit -m "feat: LIFE ISSUES #NNN" && git push
```

`life-issue:publish` は MADE 1〜3 件 / FOUND 1 件 / WHY 100〜200字 / NEXT QUESTION を
検証し、通らなければ何も書かない。

### 6. 任意: 問いへの AI の追記

公開後、前号までと同じ手順で Gemini に短い考えを足せる。これも本人の OK が必要。

```bash
npm run life-issue:thought:collect -- --issue NNN
npm run life-issue:thought:show -- --issue NNN
npm run life-issue:thought:publish -- --issue NNN --entry <ID> --confirmed-in-project-chat
```
