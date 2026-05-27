import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "../App";

function mockDashboardFetch({ countTrafficFetch }: { countTrafficFetch?: () => void } = {}) {
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

    if (url.includes("/data/news.json")) {
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
    expect(screen.getByText("Online")).toBeInTheDocument();
    expect(screen.queryByText("Last Sync")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Weather detail" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Traffic detail" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Traffic detail" }));
    expect(await screen.findByRole("button", { name: "Home" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Home" }));
    expect(screen.getByRole("button", { name: "Weather detail" })).toBeInTheDocument();
  });

  it("does not refetch when display mode changes", async () => {
    let trafficFetchCount = 0;
    mockDashboardFetch({ countTrafficFetch: () => { trafficFetchCount += 1; } });

    render(<App />);

    await screen.findByRole("button", { name: "Traffic detail" });
    expect(trafficFetchCount).toBe(1);

    await userEvent.click(screen.getByRole("button", { name: "Traffic detail" }));
    await screen.findByRole("button", { name: "Home" });
    await userEvent.click(screen.getByRole("button", { name: "Home" }));
    await screen.findByRole("button", { name: "Traffic detail" });

    expect(trafficFetchCount).toBe(1);
  });
});
