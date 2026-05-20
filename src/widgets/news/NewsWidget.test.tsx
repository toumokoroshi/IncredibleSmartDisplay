import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { WidgetConfig } from "../../types/widget";
import { mockNewsData } from "../../services/news/mockData";
import { NewsWidget } from "./NewsWidget";
import type { NewsSettings } from "./types";

const config: WidgetConfig<NewsSettings> = {
  id: "news-main",
  type: "news",
  title: "News",
  enabled: true,
  size: "medium",
  refreshIntervalSec: 1800,
  order: 4,
  area: "sub-right",
  settings: {
    provider: "mock",
    feeds: [{ id: "nhk", name: "NHK" }],
    maxItems: 5,
    showSource: true,
    showPublishedAt: true,
  },
};

describe("NewsWidget", () => {
  it("renders the compact quick look by default", () => {
    render(<NewsWidget config={config} data={mockNewsData} isEmpty={false} isHighlighted={false} status="success" />);

    expect(screen.getByText("News")).toBeInTheDocument();
    expect(screen.getByText("政府、家庭向け電気料金支援の新方針を発表")).toBeInTheDocument();
    expect(screen.queryByText("ニュース クイックルック")).not.toBeInTheDocument();
  });

  it("renders the detail news screen when highlighted", () => {
    render(<NewsWidget config={config} data={mockNewsData} isEmpty={false} isHighlighted status="success" />);

    expect(screen.getByText("ニュース クイックルック")).toBeInTheDocument();
    expect(screen.getByText("最新ヘッドライン")).toBeInTheDocument();
    expect(screen.getByText("夏の電力需要が高まる前に、補助制度と地域別の支援策を見直す方針です。")).toBeInTheDocument();
  });
});
