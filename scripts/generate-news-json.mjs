import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// The news detail screen shows the full summary in a tap-to-expand overlay,
// so keep enough text for a few sentences while still bounding JSON size.
export const SUMMARY_MAX_CHARS = 400;

export const DEFAULT_NEWS_FEEDS = [
  {
    id: "itmedia-news",
    name: "ITmedia NEWS",
    category: "Tech",
    url: "https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml",
  },
  {
    id: "hacker-news",
    name: "Hacker News",
    category: "Tech",
    url: "https://hnrss.org/frontpage",
  },
];

if (isDirectRun()) {
  await generateNewsJsonFromEnv();
}

export async function generateNewsJsonFromEnv(env = process.env) {
  return generateNewsJson({
    feeds: parseFeeds(env.NEWS_FEEDS_JSON) ?? DEFAULT_NEWS_FEEDS,
    maxItems: parsePositiveInteger(env.NEWS_MAX_ITEMS, 5),
    outputPath: resolve(process.cwd(), env.NEWS_OUTPUT_PATH ?? "public/data/news.json"),
    timeoutMs: parsePositiveInteger(env.NEWS_TIMEOUT_MS, 15000),
  });
}

export async function generateNewsJson({ feeds, maxItems, outputPath, timeoutMs }) {
  const items = await collectNewsItems(feeds, timeoutMs);
  if (items.length === 0) {
    throw new Error("No news items were generated from configured feeds");
  }

  const data = buildNewsData(items, maxItems, new Date());
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");

  console.log(`Generated ${data.items.length} news items at ${outputPath}`);
  return data;
}

export function buildNewsData(items, maxItems, generatedAtDate) {
  const normalizedItems = dedupeNewsItems(items)
    .sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime() || left.title.localeCompare(right.title))
    .slice(0, maxItems)
    .map((item, index) => ({
      ...item,
      priority: index === 0 ? "top" : "normal",
    }));

  return {
    generatedAt: generatedAtDate.toISOString(),
    items: normalizedItems,
  };
}

export async function collectNewsItems(configuredFeeds, timeoutMs) {
  const results = await Promise.allSettled(configuredFeeds.map((feed) => fetchFeedItems(feed, timeoutMs)));
  const items = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      items.push(...result.value);
      continue;
    }

    console.warn("[news-generator]", result.reason instanceof Error ? result.reason.message : String(result.reason));
  }

  return dedupeNewsItems(items);
}

export async function fetchFeedItems(feed, timeoutMs) {
  validateFeedConfig(feed);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(feed.url, {
      headers: {
        "user-agent": "IncredibleSmartDisplay news generator",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${feed.id}: ${response.status}`);
    }

    return parseFeedItems(await response.text(), feed);
  } finally {
    clearTimeout(timeout);
  }
}

export function parseFeedItems(xml, feed) {
  validateFeedConfig(feed);

  return parseFeedEntries(xml)
    .map((entry, index) => normalizeFeedEntry(entry, feed, index))
    .filter(Boolean);
}

function normalizeFeedEntry(entry, feed, index) {
  const title = normalizeWhitespace(getFirst(entry, ["title"]));
  const link = normalizeWhitespace(getLink(entry));
  const rawDate = getFirst(entry, ["pubDate", "dc:date", "published", "updated"]);
  const publishedAt = normalizeDate(rawDate);

  if (!title || !publishedAt) {
    return undefined;
  }

  return {
    id: `${feed.id}-${stableHash(`${link || title}-${publishedAt}-${index}`)}`,
    title: clampText(title, 120),
    summary: clampText(stripHtml(normalizeWhitespace(getFirst(entry, ["description", "summary", "content:encoded", "content"])) ?? ""), SUMMARY_MAX_CHARS),
    category: normalizeWhitespace(getFirst(entry, ["category"])) || feed.category,
    priority: "normal",
    source: feed.name,
    publishedAt,
  };
}

function parseFeedEntries(xml) {
  const itemEntries = collectBlocks(xml, "item");
  if (itemEntries.length > 0) {
    return itemEntries;
  }

  return collectBlocks(xml, "entry");
}

function collectBlocks(xml, tagName) {
  const blocks = [];
  const pattern = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "gi");
  let match = pattern.exec(xml);

  while (match !== null) {
    blocks.push(match[1] ?? "");
    match = pattern.exec(xml);
  }

  return blocks;
}

function getFirst(xml, tagNames) {
  for (const tagName of tagNames) {
    const value = getTagText(xml, tagName);
    if (value) {
      return value;
    }
  }

  return undefined;
}

function getTagText(xml, tagName) {
  const escapedTagName = tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`<${escapedTagName}\\b[^>]*>([\\s\\S]*?)<\\/${escapedTagName}>`, "i");
  const match = pattern.exec(xml);
  return match?.[1] ? decodeXmlText(match[1]) : undefined;
}

function getLink(xml) {
  const linkText = getTagText(xml, "link");
  if (linkText) {
    return linkText;
  }

  const atomLink = /<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\/?>/i.exec(xml);
  return atomLink?.[1] ? decodeXmlText(atomLink[1]) : undefined;
}

function normalizeDate(value) {
  if (!value) {
    return undefined;
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return undefined;
  }

  return new Date(timestamp).toISOString();
}

function normalizeWhitespace(value) {
  return value?.replace(/\s+/g, " ").trim();
}

function stripHtml(value) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function clampText(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trim()}...`;
}

function decodeXmlText(value) {
  const withoutCdata = value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  return withoutCdata
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, codePoint) => String.fromCodePoint(Number(codePoint)))
    .replace(/&#x([0-9a-f]+);/gi, (_, codePoint) => String.fromCodePoint(Number.parseInt(codePoint, 16)));
}

function dedupeNewsItems(items) {
  const seenKeys = new Set();
  const uniqueItems = [];

  for (const item of items) {
    const key = `${item.source}:${item.title}`;
    if (seenKeys.has(key)) {
      continue;
    }
    seenKeys.add(key);
    uniqueItems.push(item);
  }

  return uniqueItems;
}

function stableHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseFeeds(value) {
  if (!value) {
    return undefined;
  }

  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed)) {
    throw new Error("NEWS_FEEDS_JSON must be an array");
  }

  return parsed;
}

function validateFeedConfig(feed) {
  if (!feed || typeof feed !== "object") {
    throw new Error("Invalid news feed config");
  }

  for (const key of ["id", "name", "category", "url"]) {
    if (typeof feed[key] !== "string" || feed[key].trim().length === 0) {
      throw new Error(`Invalid news feed config: ${key}`);
    }
  }
}

function isDirectRun() {
  return process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1];
}
