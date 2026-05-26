import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import App from "../App";

describe("dashboard integration", () => {
  it("renders dashboard widgets and switches display mode from a quick-look card tap", async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes("/data/traffic.json")) {
        return {
          json: async () => ({
            lines: [
              { id: "jr-chuo-rapid", name: "中央線快速", operator: "JR東日本", status: "normal", updatedAt: "2026-05-22T07:30:00+09:00" },
              { id: "tokyo-metro-tozai", name: "東京メトロ東西線", operator: "東京メトロ", status: "normal", updatedAt: "2026-05-22T07:30:00+09:00" },
              { id: "jr-yamanote", name: "山手線", operator: "JR東日本", status: "normal", updatedAt: "2026-05-22T07:30:00+09:00" },
              { id: "jr-sobu-local", name: "総武線各駅停車", operator: "JR東日本", status: "normal", updatedAt: "2026-05-22T07:30:00+09:00" },
              { id: "tokyo-metro-marunouchi", name: "丸ノ内線", operator: "東京メトロ", status: "normal", updatedAt: "2026-05-22T07:30:00+09:00" },
              { id: "tokyo-metro-ginza", name: "銀座線", operator: "東京メトロ", status: "normal", updatedAt: "2026-05-22T07:30:00+09:00" },
              { id: "keio-line", name: "京王線", operator: "京王電鉄", status: "normal", updatedAt: "2026-05-22T07:30:00+09:00" },
              { id: "keio-inokashira", name: "京王井の頭線", operator: "京王電鉄", status: "normal", updatedAt: "2026-05-22T07:30:00+09:00" },
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
                title: "Static JSON news provider is available",
                priority: "top",
                source: "Local JSON",
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

    render(<App />);

    expect(await screen.findByText(/Tokyo/)).toBeInTheDocument();
    expect(screen.getByText("Online")).toBeInTheDocument();
    expect(screen.queryByText("Last Sync")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Weather detail" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Traffic detail" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Traffic detail" }));
    expect(await screen.findByText(/登録路線はすべて通常運行/)).toBeInTheDocument();
    expect(screen.getByText(/通常どおり移動できます/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Home" }));
    expect(screen.getByRole("button", { name: "Weather detail" })).toBeInTheDocument();
  });
});
