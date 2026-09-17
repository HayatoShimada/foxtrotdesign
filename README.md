# foxtrotdesign

Hayato Shimada の活動をまとめたポートフォリオサイト。
note.com と GitHub のコンテンツを Gemini AI で要約し、ミニマルなデザインで表示する。

https://foxtrotdesign.dev

## Tech Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS v4
- Google Gemini API
- Vercel

## Setup

```bash
npm install
```

`.env.local` を作成：

```
GEMINI_API_KEY=your_key
GITHUB_USERNAME=HayatoShimada
NOTE_COM_USERNAME=85_store
CRON_SECRET=your_secret
```

## Commands

```bash
npm run dev              # 開発サーバー起動
npm run build            # コンテンツ集約（キャッシュ使用） + ビルド
npm run aggregate        # コンテンツ集約（キャッシュ使用）
npm run aggregate:fresh  # コンテンツ全件再要約（キャッシュなし）
npm run lint             # ESLint
```

## Content Pipeline

1. GitHub API から各リポジトリの最新コミットを取得
2. note.com の RSS フィードから記事と画像を取得
3. note.com 記事のみ Gemini AI で要約（GitHub はコミットメッセージをそのまま使用）
4. 要約済みコンテンツは `content/research/summarized.json` にキャッシュされ、次回は新規分のみ要約

## Pages

サイト全体は **LIFE ISSUES → INPUT → OUTPUT → LIFE ISSUES** の循環で構成される。
各号の「次の問い」が INPUT（読むもの）を決め、それが OUTPUT（つくるもの）になり、次の号で振り返る。

- **/** — foxtrotdesign の紹介と最新号
- **/life-issues** — 不定期発行の号（MADE / FOUND / WHY / NEXT QUESTION）
- **/input** — いまの問い、読書リスト、AIからの提案
- **/output** — 活動タイムライン、リポジトリ、全ソースのコンテンツ一覧
- **/images** — 各ソースから収集した画像一覧
- **/about** — プロフィール

## Deploy

Vercel にデプロイ。`npm run build` で自動的にコンテンツ集約が実行される。
Vercel Cron (`vercel.json`) で毎日 3:00 UTC に `/api/aggregate` を呼び出してコンテンツを更新。
