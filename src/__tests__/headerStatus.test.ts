import { describe, expect, it } from "vitest";

import { summarizeHeaderStatus } from "../utils/headerStatus";

describe("header status summary", () => {
  it("counts loading, error, and stale widgets separately", () => {
    const result = summarizeHeaderStatus({
      online: true,
      lastSyncedAt: "2026-05-12T00:00:00.000Z",
      statuses: {
        calendar: "success",
        news: "error",
        stocks: "stale",
        weather: "loading",
      },
    });

    expect(result).toEqual({
      online: true,
      lastSyncedAt: "2026-05-12T00:00:00.000Z",
      refreshingCount: 1,
      errorCount: 1,
      staleCount: 1,
    });
  });

  it("does not count offline as an error", () => {
    const result = summarizeHeaderStatus({
      online: false,
      statuses: {
        calendar: "offline",
        news: "success",
      },
    });

    expect(result.errorCount).toBe(0);
    expect(result.staleCount).toBe(0);
  });
});
