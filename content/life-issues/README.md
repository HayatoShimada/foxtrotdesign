# LIFE ISSUES publishing

`npm run life-issue:draft` は、`content/research/summarized.json` と
`content/research/images.json` の直近7日分から `draft.json` を作ります。
このファイルだけではサイトに公開されません。

公開時は、Hayato が foxtrot Project チャットに書いた次の2点を使います。

```text
WHY（100〜200字）:
...

NEXT QUESTION:
...
```

1. `draft.json` の `why` と `nextQuestion` に本人の文を入れる
2. 本人の OK を受けてから公開スクリプトを実行する。
   `status` / `publishedAt` の書き換え、`publishTo` / `note` の除去、
   `issues/NNN.json` への保存と検証をまとめて行う

   ```bash
   npm run life-issue:publish -- --confirmed-in-project-chat
   ```

3. `npm run check:disclosure` を通し、コミットしてデプロイする

Claude Code からは `.claude/skills/life-issue/SKILL.md` の手順
（「issueをまとめて」で起動）が同じ流れを実行する。

公開JSONは、MADEを1〜3件、FOUNDを1件、WHYを100〜200字、
NEXT QUESTIONを1件含む場合だけビルドに使われます。

## 次の問いへの追記

追記の収集と公開はLIFE ISSUES本体とは別の手動フローです。日次集約や
サイトのAIチャットから公開されることはありません。

### 1. 安価な資料から下書きを追記する

号ごとの公開ページ／RSS設定は `thoughts/sources/NNN.json` に置きます。
既存のGitHub・note集約も併用し、Gemini Flashで短い結論と2〜4件の
根拠リンクを作ります。同じ号で再実行すると、日付付きの新しい下書きが
追記されます。

```bash
npm run life-issue:thought:collect -- --issue 1
```

下書きは `thoughts/drafts/NNN.json` と `.md` にだけ保存され、サイトは
読み込みません。

### 2. Projectチャットで確認する

コーディネーターが次の出力をfoxtrot Projectチャットへ貼ります。

```bash
npm run life-issue:thought:show -- --issue 1
```

### 3. HayatoのOK後だけ公開する

OKを受けた下書きIDを明示して、公開済みの号へ追加します。確認フラグが
ない場合、このコマンドは何も変更せず失敗します。

```bash
npm run life-issue:thought:publish -- \
  --issue 1 \
  --entry 001-20260916-01 \
  --confirmed-in-project-chat
```

追加された思考だけが各ページのNEXT QUESTIONに同じ組版で続けて表示
されます。見出しや署名で書き手を分けません。下書きの修正も公開操作も
Projectチャットでの依頼を起点に行い、サイトのHayatoShimada AIチャット
には接続しません。
