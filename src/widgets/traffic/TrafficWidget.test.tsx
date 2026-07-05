import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { WidgetConfig } from "../../types/widget";
import { mockTrafficLines } from "../../services/traffic/mockData";
import { TrafficWidget } from "./TrafficWidget";
import type { TrafficData, TrafficLineData, TrafficSettings } from "./types";

const config: WidgetConfig<TrafficSettings> = {
  id: "traffic-main",
  type: "traffic",
  title: "Traffic",
  enabled: true,
  size: "medium",
  refreshIntervalSec: 300,
  order: 5,
  area: "sub-left",
  settings: {
    provider: "mock",
    maxItems: 8,
    showLineUpdatedAt: true,
    allowLocalOverride: false,
    lines: [],
  },
};

const suspendedLine: TrafficLineData = {
  id: "keio-line",
  name: "京王線",
  operator: "京王電鉄",
  status: "suspended",
  updatedAt: "2026-05-19T07:36:00+09:00",
  detail: "笹塚〜調布間",
  reason: "車両点検",
  recoveryEstimate: "未定",
  alternateTransport: "京王井の頭線",
};

const mixedLines: TrafficLineData[] = mockTrafficLines.map((line) =>
  line.id === "keio-line" ? suspendedLine : line,
);

const mixedData: TrafficData = {
  generatedAt: "2026-05-19T07:40:00+09:00",
  updatedAt: "2026-05-19T07:40:00+09:00",
  lines: mixedLines,
};

describe("TrafficWidget", () => {
  it("renders the compact quick look summary with a normal/delayed/suspended mix", () => {
    render(<TrafficWidget config={config} data={mixedData} isEmpty={false} isHighlighted={false} status="success" />);

    expect(screen.getByText("Traffic")).toBeInTheDocument();
    expect(screen.getByText("見合わせ 3/8")).toBeInTheDocument();
    expect(screen.getByText("通常 5/8")).toBeInTheDocument();
    expect(screen.getByText("中央線快速")).toBeInTheDocument();
    expect(screen.getByText("+12")).toBeInTheDocument();
    expect(screen.getByText("一部")).toBeInTheDocument();
    expect(screen.getByText("停止")).toBeInTheDocument();
    expect(screen.getAllByText("OK").length).toBeGreaterThan(0);
  });

  it("renders the detail screen headline and metrics when highlighted", () => {
    render(<TrafficWidget config={config} data={mixedData} isEmpty={false} isHighlighted status="success" />);

    expect(screen.getByText("現在の状況")).toBeInTheDocument();
    expect(screen.getByText("1路線で運転見合わせ")).toBeInTheDocument();
    expect(screen.getByText("経路変更を確認してください。")).toBeInTheDocument();
    expect(screen.getByText("見合わせを最優先")).toBeInTheDocument();
    expect(screen.getByText("登録路線")).toBeInTheDocument();
    expect(screen.getByText("8路線")).toBeInTheDocument();
  });

  it("shows loading, error, and empty states", () => {
    const { rerender } = render(<TrafficWidget config={config} isEmpty={false} status="loading" />);
    expect(screen.getByText("Traffic")).toBeInTheDocument();

    rerender(
      <TrafficWidget
        config={config}
        error={{ code: "NETWORK_ERROR", message: "Network unavailable", retryable: true }}
        isEmpty={false}
        status="error"
      />,
    );
    expect(screen.getByText("Network unavailable")).toBeInTheDocument();

    rerender(<TrafficWidget config={config} data={{ generatedAt: undefined, updatedAt: "2026-05-19T07:40:00+09:00", lines: [] }} isEmpty status="success" />);
    expect(screen.queryByText("見合わせ")).not.toBeInTheDocument();
  });
});
