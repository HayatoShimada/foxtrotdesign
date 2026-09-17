# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio website for Hayato Shimada (foxtrotdesign). Aggregates content from note.com and GitHub, summarized via Gemini AI. Deployed at https://foxtrotdesign.dev.

Design reference: https://www.pi.website/ — brutalist-minimal, monospace, black/white only.

## Tech Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS v4 (via `@tailwindcss/postcss`)
- Google Gemini API (`@google/generative-ai`)
- Vercel deployment with daily cron

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run lint       # ESLint
npm run aggregate  # Fetch content from GitHub/note.com and summarize with Gemini
npm run reading:sync       # (Pi only) project SilverBullet reading tasks into content/research/reading.json
npm run suggest:generate   # Ask Gemini for next reads → content/research/suggested.json (status: draft)
npm run suggest:publish    # Flip the draft to published; nothing shows on /input until this runs
npm run life-issue:publish -- --confirmed-in-project-chat   # Validate draft.json and write issues/NNN.json
npm run news:sync          # (Pi timer) fetch RSS sources, score by relevance to the current question → news.json
npm run news:evolve        # (Pi timer) promote/stop sources by contribution → news-sources.json
npm run news:discover      # (Pi timer) Gemini Search Grounding → new candidate feeds; skipped unless the question changed or 28 days passed (--force overrides)
```

The `life-issue` Skill (`.claude/skills/life-issue/SKILL.md`) runs the whole issue cycle:
collect the diff since the last issue, draft WHY / NEXT QUESTION, publish only after Hayato's OK.

## Architecture

### Content Pipeline

1. **Aggregators** (`src/lib/aggregators/`) fetch raw content from GitHub API and note.com RSS
2. **Gemini** (`src/lib/gemini.ts`) summarizes each item into 2-3 sentences
3. **Build script** (`src/scripts/aggregate-content.ts`) orchestrates fetch → summarize → save to `content/research/`
4. Pages read from `content/research/summarized.json` and `images.json` at build time
5. Vercel cron (`/api/aggregate`) triggers daily refresh at 3:00 UTC
6. **News** (`/input` 03 / NEWS) is written by the Pi, not by the Vercel build: `scripts/news-cron.sh`
   runs `news:sync` → `news:evolve` (→ `news:discover` on Sundays) and pushes
   `content/research/news*.json` + `source-discoveries.json`. Source state (active / candidate / stopped)
   lives in git, so it accumulates across runs. Seeds are never stopped for low contribution.
   Scores are cached per article URL in `data/news-state.json` (gitignored, Pi-local): a 7-day window
   run daily would otherwise re-score the same article up to 7 times and inflate the ledger's
   `fetched` / `adopted` counts. The cache is dropped when the question changes

### Pages

The site is organized as a cycle: **LIFE ISSUES → INPUT → OUTPUT → LIFE ISSUES**.
Each issue's `nextQuestion` drives what gets read (INPUT), which drives what gets made (OUTPUT),
which is reflected on in the next issue.

- `/` — Home with the latest issue and a directory
- `/life-issues` — Irregular issues: MADE / FOUND / WHY / NEXT QUESTION (`/life-issues/[issue]`, RSS at `/life-issues/rss.xml`)
- `/input` — Current question, reading list (papers/books), AI suggestions
- `/output` — Activity timeline, repositories, all aggregated content (GitHub / note.com / Zenn / Bluesky)
- `/images` — Grid of image-bearing content items
- `/about` — Profile and explore cards

### Key Directories

- `src/lib/aggregators/` — GitHub and note.com content fetchers
- `src/lib/gemini.ts` — Gemini summarization with batch processing
- `src/components/research/` — ResearchList and ResearchItem components
- `content/research/` — Generated JSON files (committed)
- `data/` — Raw cache (gitignored)

## Design Tokens (globals.css)

Custom theme via Tailwind v4 `@theme`: `--color-muted`, `--color-border`, `--color-foreground`, `--shadow-brutal-sm`, `--shadow-brutal-md`. Monospace body, serif headings.

## Environment Variables

- `GEMINI_API_KEY` — Google Gemini API key (required for summarization)
- `GITHUB_USERNAME` — defaults to `HayatoShimada`
- `NOTE_COM_USERNAME` — defaults to `85_store`
- `CRON_SECRET` — auth token for `/api/aggregate` endpoint

## Language

DESIGN.md and site content are in Japanese. Respect bilingual context.
