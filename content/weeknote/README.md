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
4. `generatedAt`、`publishTo`、`note` を公開JSONから削除する
5. ビルドを確認してデプロイする

公開JSONは、MADEを1〜3件、FOUNDを1件、WHYを100〜200字、
NEXT QUESTIONを1件含む場合だけビルドに使われます。
