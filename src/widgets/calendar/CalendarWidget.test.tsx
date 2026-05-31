import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { WidgetConfig } from "../../types/widget";
import { CalendarWidget } from "./CalendarWidget";
import type { CalendarSettings } from "./types";

const calendarConfig: WidgetConfig<CalendarSettings> = {
  enabled: true,
  id: "calendar-main",
  order: 2,
  refreshIntervalSec: 600,
  settings: {
    daysAhead: 7,
    maxTodayEvents: 0,
    maxTomorrowEvents: 0,
    provider: "localDate",
    showAllDayEvents: false,
  },
  size: "large",
  title: "Calendar",
  type: "calendar",
};

describe("CalendarWidget", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-31T08:00:00.000+09:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders local date information when no calendar events are available", () => {
    render(<CalendarWidget config={calendarConfig} data={{ items: [] }} isEmpty={false} status="success" />);

    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("May 31")).toBeInTheDocument();
    expect(screen.getByText("Sunday")).toBeInTheDocument();
    expect(screen.getByText("Tomorrow: Jun 1 Mon")).toBeInTheDocument();
    expect(screen.queryByText("No data available.")).not.toBeInTheDocument();
  });

  it("keeps the highlighted detail layout useful without private calendar data", () => {
    render(<CalendarWidget config={calendarConfig} data={{ items: [] }} isEmpty={false} isHighlighted status="success" />);

    expect(screen.getByText("Today and week")).toBeInTheDocument();
    expect(screen.getByText("May 31")).toBeInTheDocument();
    expect(screen.getByText("Tomorrow: Jun 1 Mon")).toBeInTheDocument();
    expect(screen.queryByText("No upcoming events")).not.toBeInTheDocument();
  });
});
