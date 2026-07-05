import type { WidgetService } from "../../types/widget";
import { fetchStaticJson } from "../jsonProvider";
import { mockNewsData } from "./mockData";
import type { NewsData, NewsItem, NewsSettings } from "../../widgets/news";

function isNewsData(value: unknown): value is NewsData {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const items = (value as { items?: unknown }).items;
  const generatedAt = (value as { generatedAt?: unknown }).generatedAt;
  return optionalIsoDateTimeString(generatedAt) && Array.isArray(items) && items.every(isNewsItem);
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
    optionalIsoDateTimeString(item.publishedAt)
  );
}

function optionalString(value: unknown) {
  return value === undefined || typeof value === "string";
}

function optionalIsoDateTimeString(value: unknown) {
  return value === undefined || (typeof value === "string" && Number.isNaN(Date.parse(value)) === false);
}

async function fetchStaticJsonNews(settings: Extract<NewsSettings, { provider: "staticJson" }>) {
  const payload = await fetchStaticJson({
    cacheBusterIntervalSec: settings.cacheBusterIntervalSec,
    failureMessagePrefix: "Failed to fetch news JSON",
    invalidMessage: "Invalid news JSON",
    url: settings.url,
    validate: isNewsData,
  });

  return {
    generatedAt: payload.generatedAt,
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
