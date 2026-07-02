import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { HeaderBar } from "./HeaderBar";

describe("HeaderBar", () => {
  it("renders quiet status and only non-zero widget state counts", () => {
    render(
      <HeaderBar
        isDetailMode={false}
        locationName="Tokyo"
        onHomeClick={vi.fn()}
        onRefreshClick={vi.fn()}
        status={{
          errorCount: 2,
          lastSyncedAt: "2026-05-21T09:00:00.000Z",
          online: true,
          refreshingCount: 1,
          staleCount: 3,
        }}
      />,
    );

    expect(screen.getByText("オンライン")).toBeInTheDocument();
    expect(screen.getByText(/^更新 \d/)).toBeInTheDocument();
    expect(screen.getByText("同期中 1")).toBeInTheDocument();
    expect(screen.getByText("エラー 2")).toBeInTheDocument();
    expect(screen.getByText("更新遅延 3")).toBeInTheDocument();
    expect(screen.queryByText("Connected")).not.toBeInTheDocument();
    expect(screen.queryByText("Last Sync")).not.toBeInTheDocument();
  });

  it("renders offline state and home command in detail mode", async () => {
    const onHomeClick = vi.fn();
    const onRefreshClick = vi.fn();

    render(
      <HeaderBar
        isDetailMode
        onHomeClick={onHomeClick}
        onRefreshClick={onRefreshClick}
        status={{
          errorCount: 0,
          online: false,
          refreshingCount: 0,
          staleCount: 0,
        }}
      />,
    );

    expect(screen.getByText("オフライン")).toBeInTheDocument();
    expect(screen.getByText("更新待ち")).toBeInTheDocument();
    expect(screen.queryByText("Disconnected")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "ホーム" }));
    expect(onHomeClick).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole("button", { name: "更新" }));
    expect(onRefreshClick).toHaveBeenCalledTimes(1);
  });
});
