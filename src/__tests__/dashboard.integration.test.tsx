import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "../app/App";

function mockDashboardFetch({
  countNewsFetch,
  countTrafficFetch,
}: {
  countNewsFetch?: () => void;
  countTrafficFetch?: () => void;
} = {}) {
  vi.mocked(fetch).mockImplementation(async (input) => {
    const url = String(input);

    if (url.includes("/data/traffic.json")) {
      countTrafficFetch?.();
      return {
        json: async () => ({
          lines: [
            { id: "jr-chuo-rapid", name: "中央線快速", operator: "JR東日本", status: "normal", updatedAt: "2026-05-22T07:30:00+09:00" },
            { id: "tokyo-metro-tozai", name: "東京メトロ東西線", operator: "東京メトロ", status: "normal", updatedAt: "2026-05-22T07:30:00+09:00" },
          ],
          updatedAt: "2026-05-22T07:30:00+09:00",
        }),
        ok: true,
        status: 200,
      } as Response;
    }

    if (url.includes("/data/calendar.json")) {
      return {
        json: async () => ({
          items: [
            {
              calendarName: "Home",
              id: "calendar-static-1",
              startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
              title: "Static JSON calendar provider is available",
            },
          ],
        }),
        ok: true,
        status: 200,
      } as Response;
    }

    if (url.includes("/data/news.json")) {
      countNewsFetch?.();
      return {
        json: async () => ({
          items: [
            {
              id: "static-1",
              priority: "top",
              source: "Local JSON",
              title: "Static JSON news provider is available",
            },
          ],
        }),
        ok: true,
        status: 200,
      } as Response;
    }

    if (url.includes("/pets/manifest.json")) {
      return {
        json: async () => ({ photos: [] }),
        ok: true,
        status: 200,
      } as Response;
    }

    throw new Error("offline");
  });
}

describe("dashboard integration", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders dashboard widgets and switches display mode from a quick-look card tap", async () => {
    mockDashboardFetch();

    render(<App />);

    expect(await screen.findByText(/Tokyo/)).toBeInTheDocument();
    expect(screen.getByText("オンライン")).toBeInTheDocument();
    expect(screen.queryByText("Last Sync")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Weather detail" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Traffic detail" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Traffic detail" }));
    expect(await screen.findByRole("button", { name: "ホーム" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "ホーム" }));
    expect(screen.getByRole("button", { name: "Weather detail" })).toBeInTheDocument();
  }, 10000);

  it("does not refetch when display mode changes", async () => {
    let trafficFetchCount = 0;
    mockDashboardFetch({ countTrafficFetch: () => { trafficFetchCount += 1; } });

    render(<App />);

    await screen.findByRole("button", { name: "Traffic detail" });
    expect(trafficFetchCount).toBe(1);

    fireEvent.click(screen.getByRole("button", { name: "Traffic detail" }));
    await screen.findByRole("button", { name: "ホーム" });
    fireEvent.click(screen.getByRole("button", { name: "ホーム" }));
    await screen.findByRole("button", { name: "Traffic detail" });

    expect(trafficFetchCount).toBe(1);
  });

  it("refreshes only the widgets currently rendered in the dashboard shell", async () => {
    let newsFetchCount = 0;
    let trafficFetchCount = 0;
    mockDashboardFetch({
      countNewsFetch: () => {
        newsFetchCount += 1;
      },
      countTrafficFetch: () => {
        trafficFetchCount += 1;
      },
    });

    render(<App />);

    await screen.findByRole("button", { name: "Traffic detail" });
    expect(newsFetchCount).toBe(1);
    expect(trafficFetchCount).toBe(1);

    fireEvent.click(screen.getByRole("button", { name: "Traffic detail" }));
    await screen.findByRole("button", { name: "ホーム" });
    fireEvent.click(screen.getByRole("button", { name: "更新" }));

    await waitFor(() => expect(trafficFetchCount).toBe(2));
    expect(newsFetchCount).toBe(1);

    fireEvent.click(screen.getByRole("button", { name: "ホーム" }));
    await screen.findByRole("button", { name: "Traffic detail" });
    fireEvent.click(screen.getByRole("button", { name: "更新" }));

    await waitFor(() => expect(trafficFetchCount).toBe(3));
    await waitFor(() => expect(newsFetchCount).toBe(2));
  });
});
