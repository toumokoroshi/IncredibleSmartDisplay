import { afterEach, describe, expect, it, vi } from "vitest";

import type { WeatherDailySummary, WeatherHourlyPoint } from "./types";
import { buildWeatherTimeline, getCurrentHourlyIndex, getDayMarkerIndexes, getTimelineKey, getTimelineTimeValue } from "./weatherTimeline";

const hourly: WeatherHourlyPoint[] = [
  { tempC: 18, time: "2026-05-20T06:00:00+09:00" },
  { tempC: 22, time: "2026-05-20T12:00:00+09:00" },
  { tempC: 17, time: "2026-05-21T06:00:00+09:00" },
];

const daily: WeatherDailySummary[] = [
  {
    label: "Today",
    sunrise: "2026-05-20T04:32:00+09:00",
    sunset: "2026-05-20T18:45:00+09:00",
  },
  {
    label: "Tomorrow",
    sunrise: "2026-05-21T04:31:00+09:00",
  },
];

describe("weatherTimeline", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("builds a sorted timeline with sun events and stable keys", () => {
    const timeline = buildWeatherTimeline(hourly, daily);

    expect(timeline).toHaveLength(6);
    expect(timeline.map(getTimelineTimeValue)).toEqual([...timeline.map(getTimelineTimeValue)].sort((a, b) => a - b));
    expect(timeline.map(getTimelineKey)).toContain("sunrise-2026-05-20T04:32:00+09:00");
    expect(timeline.map(getTimelineKey)).toContain("hourly-2026-05-20T06:00:00+09:00");
  });

  it("marks day changes", () => {
    const markers = getDayMarkerIndexes(buildWeatherTimeline(hourly, daily));

    expect(markers.has(4)).toBe(true);
  });

  it("returns the next point index or the final point after the range", () => {
    const timeline = buildWeatherTimeline(hourly, daily);

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-20T09:00:00+09:00"));
    expect(getCurrentHourlyIndex(timeline)).toBe(2);

    vi.setSystemTime(new Date("2026-05-22T09:00:00+09:00"));
    expect(getCurrentHourlyIndex(timeline)).toBe(timeline.length - 1);
  });

  it("handles invalid sun event times without a reference point", () => {
    const timeline = buildWeatherTimeline(hourly, [{ label: "Today", sunrise: "invalid" }]);
    const event = timeline.find((point) => point.kind === "sunEvent");

    expect(event?.kind).toBe("sunEvent");
    expect(event?.reference).toBeUndefined();
  });
});
