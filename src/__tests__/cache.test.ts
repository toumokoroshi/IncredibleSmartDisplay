import { beforeEach, describe, expect, it } from "vitest";

import {
  WIDGET_CACHE_SCHEMA_VERSION,
  isCacheExpired,
  readWidgetCache,
  writeWidgetCache,
  type WidgetCacheRecord,
} from "../utils/cache";

describe("widget cache", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("restores a valid cache record", () => {
    writeWidgetCache("weather-main", { currentTempC: 20 }, 3);

    expect(readWidgetCache("weather-main")?.data).toEqual({ currentTempC: 20 });
  });

  it("rejects schemaVersion mismatches", () => {
    const record: WidgetCacheRecord<{ value: string }> = {
      data: { value: "old" },
      fetchedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000).toISOString(),
      schemaVersion: WIDGET_CACHE_SCHEMA_VERSION + 1,
    };
    localStorage.setItem("widget-cache:news-main", JSON.stringify(record));

    expect(readWidgetCache("news-main")).toBeNull();
  });

  it("rejects malformed cache records", () => {
    localStorage.setItem("widget-cache:calendar-main", "{bad json");

    expect(readWidgetCache("calendar-main")).toBeNull();
  });

  it("keeps expired cache readable for stale fallback decisions", () => {
    const record: WidgetCacheRecord<{ value: string }> = {
      data: { value: "stale" },
      fetchedAt: new Date(Date.now() - 2000).toISOString(),
      expiresAt: new Date(Date.now() - 1000).toISOString(),
      schemaVersion: WIDGET_CACHE_SCHEMA_VERSION,
    };
    localStorage.setItem("widget-cache:stocks-main", JSON.stringify(record));

    const restored = readWidgetCache("stocks-main");
    expect(restored?.data).toEqual({ value: "stale" });
    expect(restored ? isCacheExpired(restored) : false).toBe(true);
  });
});
