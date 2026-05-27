import { describe, expect, it, vi } from "vitest";

import type { WidgetCacheRecord } from "../utils/cache";
import { resolveWidgetStatus } from "../utils/widgetStatus";

function cache(expiresAt: string): WidgetCacheRecord<unknown> {
  return {
    data: { items: ["cached"] },
    expiresAt,
    fetchedAt: "2026-05-20T00:00:00.000Z",
    schemaVersion: 1,
  };
}

describe("widget status resolution", () => {
  it("uses loading before first fetched data", () => {
    expect(resolveWidgetStatus({ isError: false, isFetched: false, isFetching: true, isOnline: true, isPending: true })).toBe("loading");
  });

  it("uses stale when a fetch fails but cached data is displayable", () => {
    expect(resolveWidgetStatus({ cache: cache("2026-05-21T00:00:00.000Z"), isError: true, isFetched: true, isFetching: false, isOnline: true, isPending: false })).toBe("stale");
  });

  it("uses offline only when fetch failed offline without cached data", () => {
    expect(resolveWidgetStatus({ isError: true, isFetched: true, isFetching: false, isOnline: false, isPending: false })).toBe("offline");
  });

  it("uses error for online failures without cached data", () => {
    expect(resolveWidgetStatus({ isError: true, isFetched: true, isFetching: false, isOnline: true, isPending: false })).toBe("error");
  });

  it("uses stale for expired cache when no fetch is running", () => {
    vi.setSystemTime(new Date("2026-05-22T00:00:00.000Z"));
    expect(resolveWidgetStatus({ cache: cache("2026-05-21T00:00:00.000Z"), isError: false, isFetched: true, isFetching: false, isOnline: true, isPending: false })).toBe("stale");
    vi.useRealTimers();
  });
});
