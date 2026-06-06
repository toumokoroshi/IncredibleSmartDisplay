import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { type ReactNode } from "react";
import { z } from "zod";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DashboardProvider } from "../contexts/DashboardContext";
import type { AnyWidgetDefinition, WidgetCachePolicy, WidgetConfig, WidgetService } from "../types/widget";
import { WIDGET_CACHE_SCHEMA_VERSION, type WidgetCacheRecord } from "../utils/cache";
import { useWidgetData } from "./useWidgetData";

type TestSettings = { provider: "mock" };
type TestData = { items: string[] };
type HookConfig = Parameters<typeof useWidgetData>[0];

const config: WidgetConfig<TestSettings> & HookConfig = {
  enabled: true,
  id: "test-widget",
  order: 1,
  refreshIntervalSec: 0,
  settings: { provider: "mock" },
  size: "medium",
  title: "Test",
  type: "news",
};

function createDefinition(fetch: WidgetService<TestSettings, TestData>["fetch"], cachePolicy: WidgetCachePolicy = "publicPersistent"): AnyWidgetDefinition {
  return {
    component: () => null,
    createService: () => ({ fetch }),
    cacheTtlHours: 12,
    defaultRefreshIntervalSec: 0,
    fallbackArea: "sub-right",
    isEmpty: (data: TestData) => data.items.length === 0,
    settingsSchema: z.object({ provider: z.literal("mock") }),
    type: "news",
    getCachePolicy: () => cachePolicy,
    validateData: (data: unknown): data is TestData =>
      data !== null &&
      typeof data === "object" &&
      Array.isArray((data as { items?: unknown }).items) &&
      (data as { items: unknown[] }).items.every((item) => typeof item === "string"),
  };
}

function renderUseWidgetData({
  definition,
  nextConfig = config,
}: {
  definition: AnyWidgetDefinition;
  nextConfig?: HookConfig;
}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 0,
        retry: false,
      },
    },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <DashboardProvider value={{ displayMode: "home", setDisplayMode: vi.fn() }}>{children}</DashboardProvider>
    </QueryClientProvider>
  );

  return renderHook(() => useWidgetData(nextConfig, definition), { wrapper });
}

function writeCache(record: Partial<WidgetCacheRecord<TestData>>) {
  localStorage.setItem(
    "widget-cache:test-widget",
    JSON.stringify({
      data: { items: ["cached"] },
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      fetchedAt: new Date().toISOString(),
      schemaVersion: WIDGET_CACHE_SCHEMA_VERSION,
      ...record,
    }),
  );
}

function setOnline(value: boolean) {
  vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(value);
}

function nonRetryableError(message: string) {
  const error = new Error(message) as Error & { retryable: boolean };
  error.retryable = false;
  return error;
}

describe("useWidgetData", () => {
  beforeEach(() => {
    localStorage.clear();
    setOnline(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("returns success and caches fetched data", async () => {
    const definition = createDefinition(async () => ({ items: ["fresh"] }));
    const { result } = renderUseWidgetData({ definition });

    await waitFor(() => expect(result.current.status).toBe("success"));

    expect(result.current.data).toEqual({ items: ["fresh"] });
    expect(result.current.isEmpty).toBe(false);
    const cacheRecord = JSON.parse(localStorage.getItem("widget-cache:test-widget") ?? "{}") as WidgetCacheRecord<TestData>;
    expect(cacheRecord.data).toEqual({ items: ["fresh"] });
    expect(new Date(cacheRecord.expiresAt).getTime() - new Date(cacheRecord.fetchedAt).getTime()).toBe(12 * 60 * 60 * 1000);
  });

  it("returns error when fetch fails without cache", async () => {
    const definition = createDefinition(async () => {
      throw nonRetryableError("service failed");
    });
    const { result } = renderUseWidgetData({ definition });

    await waitFor(() => expect(result.current.status).toBe("error"));

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toMatchObject({ code: "UNKNOWN_ERROR", message: "service failed", retryable: false });
  });

  it("preserves service error codes for widget UI", async () => {
    const error = new Error("rate limited") as Error & { code: "API_RATE_LIMIT"; retryable: false };
    error.code = "API_RATE_LIMIT";
    error.retryable = false;
    const definition = createDefinition(async () => {
      throw error;
    });
    const { result } = renderUseWidgetData({ definition });

    await waitFor(() => expect(result.current.status).toBe("error"));

    expect(result.current.error).toMatchObject({ code: "API_RATE_LIMIT", message: "rate limited", retryable: false });
  });

  it("returns stale data when fetch fails with cache", async () => {
    writeCache({});
    const definition = createDefinition(async () => {
      throw nonRetryableError("service failed");
    });
    const { result } = renderUseWidgetData({ definition });

    await waitFor(() => expect(result.current.status).toBe("stale"));

    expect(result.current.data).toEqual({ items: ["cached"] });
  });

  it("does not read or write localStorage cache for private widgets", async () => {
    writeCache({});
    const definition = createDefinition(async () => ({ items: ["fresh-private"] }), "privateNoStore");
    const { result } = renderUseWidgetData({ definition });

    await waitFor(() => expect(result.current.status).toBe("success"));

    expect(result.current.data).toEqual({ items: ["fresh-private"] });
    expect(localStorage.getItem("widget-cache:test-widget")).toContain("cached");
  });

  it("does not use stale private data after a fetch error", async () => {
    writeCache({});
    const definition = createDefinition(async () => {
      throw nonRetryableError("reauthentication required");
    }, "privateNoStore");
    const { result } = renderUseWidgetData({ definition });

    await waitFor(() => expect(result.current.status).toBe("error"));

    expect(result.current.data).toBeUndefined();
  });

  it("ignores cache data that fails widget data validation", async () => {
    writeCache({ data: { items: [123] } as unknown as TestData });
    const definition = createDefinition(async () => {
      throw nonRetryableError("service failed");
    });
    const { result } = renderUseWidgetData({ definition });

    await waitFor(() => expect(result.current.status).toBe("error"));

    expect(result.current.data).toBeUndefined();
  });

  it("returns offline when fetch fails while offline and no cache exists", async () => {
    setOnline(false);
    const definition = createDefinition(async () => {
      throw nonRetryableError("network down");
    });
    const { result } = renderUseWidgetData({ definition });

    await waitFor(() => expect(result.current.status).toBe("offline"));

    expect(result.current.data).toBeUndefined();
  });

  it("returns stale when only expired cache is displayable", async () => {
    writeCache({
      expiresAt: new Date(Date.now() - 60 * 1000).toISOString(),
    });
    const definition = createDefinition(async () => ({ items: ["fresh"] }));
    const { result } = renderUseWidgetData({
      definition,
      nextConfig: {
        ...config,
        settingsError: "invalid settings",
      },
    });

    await waitFor(() => expect(result.current.status).toBe("stale"));

    expect(result.current.data).toEqual({ items: ["cached"] });
  });

  it("detects empty array data", async () => {
    const definition = createDefinition(async () => ({ items: [] }));
    const { result } = renderUseWidgetData({ definition });

    await waitFor(() => expect(result.current.status).toBe("success"));

    expect(result.current.isEmpty).toBe(true);
  });

  it("delegates empty detection to the widget definition", async () => {
    const definition = {
      ...createDefinition(async () => ({ items: ["not-empty-by-shape"] })),
      isEmpty: () => true,
    };
    const { result } = renderUseWidgetData({ definition });

    await waitFor(() => expect(result.current.status).toBe("success"));

    expect(result.current.data).toEqual({ items: ["not-empty-by-shape"] });
    expect(result.current.isEmpty).toBe(true);
  });
});
