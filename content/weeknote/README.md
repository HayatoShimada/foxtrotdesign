# WEEKNOTE publishing

`npm run weeknote:draft` は、`content/research/summarized.json` と
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
2. `status` を `published`、`publishedAt` を公開日にする
3. `publishTo` が示す `content/weeknote/issues/NNN.json` へ保存する
4. `publishTo`、`note` を公開JSONから削除する
5. ビルドを確認してデプロイする

公開JSONは、MADEを1〜3件、FOUNDを1件、WHYを100〜200字、
NEXT QUESTIONを1件含む場合だけビルドに使われます。

## 次の問いへの追記

追記の収集と公開はWEEKNOTE本体とは別の手動フローです。日次集約や
サイトのAIチャットから公開されることはありません。

### 1. 安価な資料から下書きを追記する

号ごとの公開ページ／RSS設定は `thoughts/sources/NNN.json` に置きます。
既存のGitHub・note集約も併用し、Gemini Flashで短い結論と2〜4件の
根拠リンクを作ります。同じ号で再実行すると、日付付きの新しい下書きが
追記されます。

```bash
npm run weeknote:thought:collect -- --issue 1
```

下書きは `thoughts/drafts/NNN.json` と `.md` にだけ保存され、サイトは
読み込みません。

### 2. Projectチャットで確認する

コーディネーターが次の出力をfoxtrot Projectチャットへ貼ります。

```bash
npm run weeknote:thought:show -- --issue 1
```

### 3. HayatoのOK後だけ公開する

OKを受けた下書きIDを明示して、公開済みの号へ追加します。確認フラグが
ない場合、このコマンドは何も変更せず失敗します。

```bash
npm run weeknote:thought:publish -- \
  --issue 1 \
  --entry 001-20260916-01 \
  --confirmed-in-project-chat
```

追加された思考だけが各ページのNEXT QUESTIONに同じ組版で続けて表示
されます。見出しや署名で書き手を分けません。下書きの修正も公開操作も
Projectチャットでの依頼を起点に行い、サイトのHayatoShimada AIチャット
には接続しません。
