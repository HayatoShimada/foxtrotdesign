import { feedParser } from "./feeds";

// ページから RSS/Atom を探す。<link rel="alternate"> → よくあるパスの順。
// 1 件以上パースできたものだけを feed として返す。

const COMMON_PATHS = ["/feed", "/rss", "/rss.xml", "/atom.xml", "/feed.xml", "/index.xml", "/feed/"];
const FETCH_TIMEOUT_MS = 15000;

async function fetchText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; foxtrotdesign-news/1.0)" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

function linkedFeeds(html: string, baseUrl: string): string[] {
  const urls: string[] = [];
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];
  for (const tag of linkTags) {
    if (!/rel=["']?alternate["']?/i.test(tag)) continue;
    if (!/type=["']?application\/(rss|atom)\+xml/i.test(tag)) continue;
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    if (!href) continue;
    try {
      urls.push(new URL(href, baseUrl).toString());
    } catch {
      // 相対パスが壊れているものは無視
    }
  }
  return urls;
}

async function readFeed(url: string): Promise<{ title: string } | null> {
  try {
    const feed = await feedParser.parseURL(url);
    return feed.items.length > 0 ? { title: (feed.title ?? "").trim() } : null;
  } catch {
    return null;
  }
}

// Grounding が返す URI は vertexaisearch.cloud.google.com のリダイレクトなので、実 URL に解決してから使う
export async function resolveRedirect(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; foxtrotdesign-news/1.0)" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
    });
    return response.url || null;
  } catch {
    return null;
  }
}

export async function discoverFeed(
  pageUrl: string
): Promise<{ url: string; title: string } | null> {
  const origin = new URL(pageUrl).origin;
  const tried = new Set<string>();

  const html = await fetchText(pageUrl);
  const candidates = html ? linkedFeeds(html, pageUrl) : [];
  // ページ自身が feed の場合もある
  candidates.unshift(pageUrl);
  for (const path of COMMON_PATHS) candidates.push(`${origin}${path}`);

  for (const candidate of candidates) {
    if (tried.has(candidate)) continue;
    tried.add(candidate);
    const feed = await readFeed(candidate);
    if (feed) return { url: candidate, title: feed.title };
  }
  return null;
}
