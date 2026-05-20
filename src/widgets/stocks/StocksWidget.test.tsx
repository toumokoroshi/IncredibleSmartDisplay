import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { mockStocksData } from "../../services/stocks/mockData";
import type { WidgetConfig, WidgetError } from "../../types/widget";
import { StocksWidget } from "./StocksWidget";
import type { StocksSettings } from "./types";

const config: WidgetConfig<StocksSettings> = {
  id: "stocks-main",
  type: "stocks",
  title: "Markets",
  enabled: true,
  size: "medium",
  refreshIntervalSec: 600,
  order: 3,
  area: "sub-left",
  settings: {
    provider: "mock",
    symbols: ["^N225", "^IXIC"],
    maxItems: 5,
    showCurrency: true,
    showMarketState: true,
  },
};

describe("StocksWidget", () => {
  it("renders market items and signed percentage changes", () => {
    render(<StocksWidget config={config} data={mockStocksData} isEmpty={false} isHighlighted={false} status="success" />);

    expect(screen.getByText("Markets")).toBeInTheDocument();
    expect(screen.getByText("Nikkei 225")).toBeInTheDocument();
    expect(screen.getByText("^N225")).toBeInTheDocument();
    expect(screen.getByText("39125.11")).toBeInTheDocument();
    expect(screen.getByText("+0.61%")).toBeInTheDocument();
    expect(screen.getByText("-0.12%")).toBeInTheDocument();
  });

  it("renders loading, error, empty, and stale states", () => {
    const error: WidgetError = { code: "UNKNOWN_ERROR", message: "service unavailable", retryable: true };
    const { rerender } = render(<StocksWidget config={config} isEmpty={false} isHighlighted={false} status="loading" />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    rerender(<StocksWidget config={config} error={error} isEmpty={false} isHighlighted={false} status="error" />);
    expect(screen.getByText("service unavailable")).toBeInTheDocument();

    rerender(<StocksWidget config={config} data={{ items: [] }} isEmpty isHighlighted={false} status="success" />);
    expect(screen.getByText("No data available.")).toBeInTheDocument();

    rerender(<StocksWidget config={config} data={mockStocksData} isEmpty={false} isHighlighted status="stale" />);
    expect(screen.getByText("Stale")).toBeInTheDocument();
  });

  it("uses a placeholder for missing change percentages", () => {
    render(
      <StocksWidget
        config={config}
        data={{ items: [{ symbol: "USDJPY=X", name: "USD/JPY", price: 156.23 }] }}
        isEmpty={false}
        isHighlighted={false}
        status="success"
      />,
    );

    expect(screen.getByText("--")).toBeInTheDocument();
  });
});
