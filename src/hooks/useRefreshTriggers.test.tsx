import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAutoReload } from "./useAutoReload";
import { useMidnightRefresh } from "./useMidnightRefresh";
import { useOnlineRefresh } from "./useOnlineRefresh";

function renderWithQueryClient(hook: () => void, queryClient: QueryClient) {
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  return renderHook(hook, { wrapper });
}

describe("refresh trigger hooks", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("refreshes only error, stale, and offline widgets after online recovery", () => {
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    renderWithQueryClient(
      () =>
        useOnlineRefresh(
          [{ id: "weather-main" }, { id: "calendar-main" }, { id: "traffic-main" }, { id: "news-main" }],
          {
            "calendar-main": "stale",
            "news-main": "offline",
            "traffic-main": "success",
            "weather-main": "error",
          },
        ),
      queryClient,
    );

    window.dispatchEvent(new Event("online"));

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["widget-data", "weather-main"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["widget-data", "calendar-main"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["widget-data", "news-main"] });
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: ["widget-data", "traffic-main"] });
  });

  it("refreshes only weather and calendar at midnight", () => {
    vi.setSystemTime(new Date("2026-05-20T23:59:59.000+09:00"));
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    renderWithQueryClient(
      () =>
        useMidnightRefresh([
          { id: "weather-main", type: "weather" },
          { id: "calendar-main", type: "calendar" },
          { id: "traffic-main", type: "traffic" },
        ]),
      queryClient,
    );

    vi.advanceTimersByTime(1000);

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["widget-data", "weather-main"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["widget-data", "calendar-main"] });
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: ["widget-data", "traffic-main"] });
  });

  it("reloads the app after the configured interval", () => {
    const reload = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, reload },
    });

    renderHook(() => useAutoReload({ enabled: true, intervalMinutes: 2 }));
    vi.advanceTimersByTime(2 * 60 * 1000);

    expect(reload).toHaveBeenCalledTimes(1);

    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });
});
