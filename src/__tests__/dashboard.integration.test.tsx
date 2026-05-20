import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import App from "../App";

describe("dashboard integration", () => {
  it("renders dashboard widgets and switches display mode from a quick-look card tap", async () => {
    render(<App />);

    expect(await screen.findByText(/Tokyo/)).toBeInTheDocument();
    expect(screen.getByText("Last Sync")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Weather detail" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Traffic detail" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Traffic detail" }));
    expect(await screen.findByText(/遅延 2\/8/)).toBeInTheDocument();
    expect(screen.getByText(/通常 6\/8/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Home" }));
    expect(screen.getByRole("button", { name: "Weather detail" })).toBeInTheDocument();
  });
});
