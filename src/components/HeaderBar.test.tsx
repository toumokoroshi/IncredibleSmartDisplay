import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { HeaderBar } from "./HeaderBar";

describe("HeaderBar", () => {
  it("renders connectivity, sync, and widget state counts", () => {
    render(
      <HeaderBar
        isDetailMode={false}
        locationName="Tokyo"
        onHomeClick={vi.fn()}
        status={{
          errorCount: 2,
          lastSyncedAt: "2026-05-21T09:00:00.000Z",
          online: true,
          refreshingCount: 1,
          staleCount: 3,
        }}
      />,
    );

    expect(screen.getByText("Online")).toBeInTheDocument();
    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByText("Last Sync")).toBeInTheDocument();
    expect(screen.getByText("Syncing")).toBeInTheDocument();
    expect(screen.getByText("Issues")).toBeInTheDocument();
    expect(screen.getByText("Stale")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders offline state and home command in detail mode", async () => {
    const onHomeClick = vi.fn();

    render(
      <HeaderBar
        isDetailMode
        onHomeClick={onHomeClick}
        status={{
          errorCount: 0,
          online: false,
          refreshingCount: 0,
          staleCount: 0,
        }}
      />,
    );

    expect(screen.getByText("Offline")).toBeInTheDocument();
    expect(screen.getByText("Disconnected")).toBeInTheDocument();
    expect(screen.getByText("Waiting")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Home" }));
    expect(onHomeClick).toHaveBeenCalledTimes(1);
  });
});
