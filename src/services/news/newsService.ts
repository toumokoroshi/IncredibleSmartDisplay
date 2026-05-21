import type { WidgetService } from "../../types/widget";
import { mockNewsData } from "./mockData";
import type { NewsData, NewsItem, NewsSettings } from "../../widgets/news";

function isNewsData(value: unknown): value is NewsData {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const items = (value as { items?: unknown }).items;
  return Array.isArray(items) && items.every(isNewsItem);
}

function isNewsItem(value: unknown): value is NewsItem {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const item = value as Partial<Record<keyof NewsItem, unknown>>;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    optionalString(item.summary) &&
    optionalString(item.category) &&
    (item.priority === undefined || item.priority === "top" || item.priority === "normal") &&
    optionalString(item.source) &&
    optionalString(item.publishedAt)
  );
}

function optionalString(value: unknown) {
  return value === undefined || typeof value === "string";
}

async function fetchStaticJsonNews(settings: Extract<NewsSettings, { provider: "staticJson" }>) {
  const response = await fetch(settings.url);

  if (!response.ok) {
    throw new Error(`Failed to fetch news JSON: ${response.status}`);
  }

  const payload: unknown = await response.json();
  if (!isNewsData(payload)) {
    throw new Error("Invalid news JSON");
  }

  return {
    items: payload.items.slice(0, settings.maxItems),
  };
}

export function createNewsService(): WidgetService<NewsSettings, NewsData> {
  return {
    async fetch(settings) {
      if (settings.provider === "staticJson") {
        return fetchStaticJsonNews(settings);
      }

      return {
        items: mockNewsData.items.slice(0, settings.maxItems),
      };
    },
  };
}
