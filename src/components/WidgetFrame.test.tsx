import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WidgetFrame } from "./WidgetFrame";

describe("WidgetFrame", () => {
  it("renders the title, icon, and children on success", () => {
    render(
      <WidgetFrame hasData icon={<span data-testid="icon" />} status="success" title="Widget Title">
        <p>Widget content</p>
      </WidgetFrame>,
    );

    expect(screen.getByText("Widget Title")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByText("Widget content")).toBeInTheDocument();
  });

  it("shows the loading state and hides children while loading", () => {
    render(
      <WidgetFrame hasData icon={<span />} status="loading" title="Widget Title">
        <p>Widget content</p>
      </WidgetFrame>,
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("Widget content")).not.toBeInTheDocument();
  });

  it("shows the error state and hides children on error", () => {
    render(
      <WidgetFrame error={{ code: "NETWORK_ERROR", message: "Network unavailable" }} hasData={false} icon={<span />} status="error" title="Widget Title">
        <p>Widget content</p>
      </WidgetFrame>,
    );

    expect(screen.getByText("Network unavailable")).toBeInTheDocument();
    expect(screen.queryByText("Widget content")).not.toBeInTheDocument();
  });

  it("shows the empty state and hides children when isEmpty", () => {
    render(
      <WidgetFrame hasData icon={<span />} isEmpty status="success" title="Widget Title">
        <p>Widget content</p>
      </WidgetFrame>,
    );

    expect(screen.getByText("No data available.")).toBeInTheDocument();
    expect(screen.queryByText("Widget content")).not.toBeInTheDocument();
  });

  it("shows a stale badge by default when status is stale", () => {
    render(
      <WidgetFrame hasData icon={<span />} status="stale" title="Widget Title">
        <p>Widget content</p>
      </WidgetFrame>,
    );

    expect(screen.getByText("Stale")).toBeInTheDocument();
    expect(screen.getByText("Widget content")).toBeInTheDocument();
  });

  it("uses headerExtra instead of the default stale badge when provided", () => {
    render(
      <WidgetFrame hasData headerExtra={<span>Custom extra</span>} icon={<span />} status="stale" title="Widget Title">
        <p>Widget content</p>
      </WidgetFrame>,
    );

    expect(screen.getByText("Custom extra")).toBeInTheDocument();
    expect(screen.queryByText("Stale")).not.toBeInTheDocument();
  });

  it("does not render children when hasData is false even on success", () => {
    render(
      <WidgetFrame hasData={false} icon={<span />} status="success" title="Widget Title">
        <p>Widget content</p>
      </WidgetFrame>,
    );

    expect(screen.queryByText("Widget content")).not.toBeInTheDocument();
  });
});
