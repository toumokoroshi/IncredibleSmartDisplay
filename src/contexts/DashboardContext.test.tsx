import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DashboardProvider, useDashboardContext } from "./DashboardContext";

function OnlineProbe() {
  const { headerStatus } = useDashboardContext();
  return <div>{headerStatus.online ? "online" : "offline"}</div>;
}

describe("DashboardProvider", () => {
  it("updates header online state when navigator online state changes", async () => {
    const online = vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(true);

    render(
      <DashboardProvider value={{ displayMode: "home", setDisplayMode: vi.fn() }}>
        <OnlineProbe />
      </DashboardProvider>,
    );

    expect(screen.getByText("online")).toBeInTheDocument();

    online.mockReturnValue(false);
    window.dispatchEvent(new Event("offline"));

    await waitFor(() => expect(screen.getByText("offline")).toBeInTheDocument());
  });
});
