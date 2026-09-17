#!/usr/bin/env bash
# Pi の timer から呼ばれる。ニュースの収集 → 進化判定 →（日曜は発見）→ 3 ファイルだけ commit / push。
# push で Vercel が再ビルドする。他の未コミット変更は巻き込まない。
set -euo pipefail
cd /home/hacopi/foxtrotdesign

git pull --rebase --quiet origin main
npm run --silent news:sync
npm run --silent news:evolve
if [ "$(date +%u)" = 7 ]; then
  npm run --silent news:discover || echo "news:discover failed (continuing)"
fi

git add content/research/news.json content/research/news-sources.json content/research/source-discoveries.json 2>/dev/null || true
if git diff --cached --quiet; then
  echo "No news changes."
  exit 0
fi
git commit --quiet -m "chore: news $(date +%F)"
git push --quiet origin main
echo "Pushed news $(date +%F)."
