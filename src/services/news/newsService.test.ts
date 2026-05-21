import { beforeEach, describe, expect, it, vi } from "vitest";

import { createNewsService } from "./newsService";

describe("createNewsService", () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
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
      showPublishedAt: true,
      showSource: true,
      url: "/data/news.json",
    });

    expect(fetch).toHaveBeenCalledWith("/data/news.json");
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
});
