import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { dashboardConfig } from "../../config/dashboard.config";
import type { NewsSettings } from "../../widgets/news";
import { newsDefinition } from "../../widgets/news";
import { createNewsService } from "./newsService";
import newsJsonRaw from "../../../public/data/news.json?raw";

describe("createNewsService", () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("1970-01-01T00:10:30.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns sliced mock news data", async () => {
    const service = createNewsService();

    const result = await service.fetch({
      feeds: [{ id: "nhk", name: "NHK" }],
      maxItems: 2,
      provider: "mock",
      showPublishedAt: true,
      showSource: true,
    });

    expect(result.items).toHaveLength(2);
    expect(result.items[0]?.id).toBe("1");
  });

  it("fetches and validates static JSON news data", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({
        items: [
          { id: "a", title: "First", priority: "top", source: "Local" },
          { id: "b", title: "Second", priority: "normal", source: "Local" },
        ],
      }),
      ok: true,
      status: 200,
    } as Response);

    const service = createNewsService();
    const result = await service.fetch({
      maxItems: 1,
      provider: "staticJson",
      cacheBusterIntervalSec: 300,
      showPublishedAt: true,
      showSource: true,
      url: "/data/news.json",
    });

    expect(fetch).toHaveBeenCalledWith("/data/news.json?v=2");
    expect(result).toEqual({
      items: [{ id: "a", title: "First", priority: "top", source: "Local" }],
    });
  });

  it("rejects malformed static JSON news data", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ items: [{ id: "missing-title" }] }),
      ok: true,
      status: 200,
    } as Response);

    const service = createNewsService();

    await expect(
      service.fetch({
        maxItems: 5,
        provider: "staticJson",
        showPublishedAt: true,
        showSource: true,
        url: "/data/news.json",
      }),
    ).rejects.toThrow("Invalid news JSON");
  });

  it("rejects static JSON news data with invalid published dates", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ items: [{ id: "bad-date", publishedAt: "not-a-date", title: "Bad date" }] }),
      ok: true,
      status: 200,
    } as Response);

    const service = createNewsService();

    await expect(
      service.fetch({
        maxItems: 5,
        provider: "staticJson",
        showPublishedAt: true,
        showSource: true,
        url: "/data/news.json",
      }),
    ).rejects.toThrow("Invalid news JSON");
  });

  it("rejects failed static JSON responses", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({}),
      ok: false,
      status: 404,
    } as Response);

    const service = createNewsService();

    await expect(
      service.fetch({
        maxItems: 5,
        provider: "staticJson",
        showPublishedAt: true,
        showSource: true,
        url: "/data/news.json",
      }),
    ).rejects.toThrow("Failed to fetch news JSON: 404");
  });

  it("keeps the published news JSON aligned with the static provider contract", () => {
    const newsWidget = dashboardConfig.widgets.find((widget) => widget.id === "news-main");
    const newsSettings = newsWidget?.settings as Extract<NewsSettings, { provider: "staticJson" }> | undefined;
    const payload = JSON.parse(newsJsonRaw) as unknown;

    expect(newsSettings?.provider).toBe("staticJson");
    expect(newsDefinition.validateData(payload)).toBe(true);

    if (!newsSettings || !newsDefinition.validateData(payload)) {
      throw new Error("news-main static JSON contract is not testable");
    }

    expect(payload.items.length).toBeGreaterThan(0);
    expect(payload.items.length).toBeLessThanOrEqual(newsSettings.maxItems);
    expect(Date.parse(payload.generatedAt ?? "")).not.toBeNaN();
    expect(new Set(payload.items.map((item) => item.id)).size).toBe(payload.items.length);

    const timestamps = payload.items.map((item) => Date.parse(item.publishedAt ?? ""));
    for (const timestamp of timestamps) {
      expect(timestamp).not.toBeNaN();
    }

    expect(timestamps).toEqual([...timestamps].sort((left, right) => right - left));
    expect(payload.items[0]?.priority).toBe("top");

    for (const [index, item] of payload.items.entries()) {
      expect(item.title.trim()).toBe(item.title);
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.source).toBeTruthy();
      expect(item.category).toBeTruthy();
      expect(item.priority).toBe(index === 0 ? "top" : "normal");
      expect(item.title).not.toMatch(/placeholder|dummy|mock|static json/i);
    }
  });
});
