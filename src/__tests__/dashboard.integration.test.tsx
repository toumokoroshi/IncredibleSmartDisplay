import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import App from "../App";

describe("dashboard integration", () => {
  it("renders dashboard widgets and switches display mode from quick area", async () => {
    render(<App />);

    expect(await screen.findByText(/Tokyo/)).toBeInTheDocument();
    expect(screen.getByText("Last Sync")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Weather" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Traffic" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ニュース" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Traffic" }));
    expect(screen.getByRole("button", { name: "Traffic" })).toHaveAttribute("aria-pressed", "true");
    expect(await screen.findByText(/遅延 2\/8/)).toBeInTheDocument();
    expect(screen.getByText(/通常 6\/8/)).toBeInTheDocument();
  });
});
