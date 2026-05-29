import { beforeEach, describe, expect, it, vi } from "vitest";

import { createStockService } from "./stockService";

describe("createStockService", () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  it("returns configured mock stock items", async () => {
    const result = await createStockService().fetch({
      maxItems: 1,
      provider: "mock",
      showCurrency: true,
      showMarketState: true,
      symbols: ["^IXIC", "^N225"],
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.symbol).toBe("^N225");
  });

  it("fetches and validates static JSON stock data", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({
        items: [
          { symbol: "^N225", name: "Nikkei 225", price: 39125.11, changePercent: 0.61, marketState: "Open" },
          { symbol: "USDJPY=X", name: "USD/JPY", price: 156.23 },
        ],
      }),
      ok: true,
      status: 200,
    } as Response);

    const result = await createStockService().fetch({
      cacheBusterIntervalSec: 600,
      maxItems: 5,
      provider: "staticJson",
      showCurrency: true,
      showMarketState: true,
      symbols: ["USDJPY=X"],
      url: "/data/stocks.json",
    });

    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/^\/data\/stocks\.json\?v=\d+$/));
    expect(result.items.map((item) => item.symbol)).toEqual(["USDJPY=X"]);
  });

  it("fetches and validates worker JSON stock data", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({
        items: [{ symbol: "^GSPC", name: "S&P 500", price: 5321.41, marketState: "Closed" }],
      }),
      ok: true,
      status: 200,
    } as Response);

    const result = await createStockService().fetch({
      maxItems: 5,
      provider: "workerJson",
      showCurrency: true,
      showMarketState: true,
      symbols: ["^GSPC"],
      url: "https://worker.example.test/stocks",
    });

    expect(fetch).toHaveBeenCalledWith("https://worker.example.test/stocks", { cache: "no-store", method: "GET" });
    expect(result.items[0]?.symbol).toBe("^GSPC");
  });

  it("rejects malformed static JSON stock data", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ items: [{ symbol: "^N225", name: "Nikkei 225" }] }),
      ok: true,
      status: 200,
    } as Response);

    await expect(
      createStockService().fetch({
        maxItems: 5,
        provider: "staticJson",
        showCurrency: true,
        showMarketState: true,
        symbols: ["^N225"],
        url: "/data/stocks.json",
      }),
    ).rejects.toThrow("Invalid stocks JSON");
  });
});
