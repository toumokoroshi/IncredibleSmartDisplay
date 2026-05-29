import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { DashboardProvider, useDashboardContext } from "./DashboardContext";

function renderDashboardProvider(children: ReactNode, setDisplayMode = vi.fn()) {
  const queryClient = new QueryClient();

  return {
    queryClient,
    setDisplayMode,
    ...render(
      <QueryClientProvider client={queryClient}>
        <DashboardProvider value={{ displayMode: "home", setDisplayMode }}>{children}</DashboardProvider>
      </QueryClientProvider>,
    ),
  };
}

function OnlineProbe() {
  const { headerStatus } = useDashboardContext();
  return <div>{headerStatus.online ? "online" : "offline"}</div>;
}

describe("DashboardProvider", () => {
  it("updates header online state when navigator online state changes", async () => {
    const online = vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(true);

    renderDashboardProvider(<OnlineProbe />);

    expect(screen.getByText("online")).toBeInTheDocument();

    online.mockReturnValue(false);
    window.dispatchEvent(new Event("offline"));

    await waitFor(() => expect(screen.getByText("offline")).toBeInTheDocument());
  });

  it("routes display mode and widget refresh through dashboard commands", async () => {
    const user = userEvent.setup();
    const setDisplayMode = vi.fn();

    function CommandProbe() {
      const { executeCommand } = useDashboardContext();

      return (
        <>
          <button type="button" onClick={() => executeCommand({ type: "SET_DISPLAY_MODE", mode: "weather" })}>
            Weather command
          </button>
          <button type="button" onClick={() => executeCommand({ type: "REFRESH_VISIBLE_WIDGETS", widgetIds: ["weather-main", "traffic-main"] })}>
            Refresh visible command
          </button>
        </>
      );
    }

    const { queryClient } = renderDashboardProvider(<CommandProbe />, setDisplayMode);
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    await user.click(screen.getByRole("button", { name: "Weather command" }));
    expect(setDisplayMode).toHaveBeenCalledWith("weather");

    await user.click(screen.getByRole("button", { name: "Refresh visible command" }));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["widget-data", "weather-main"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["widget-data", "traffic-main"] });
  });
});
