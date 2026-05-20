import { describe, expect, it } from "vitest";

import type { WeatherTimelinePoint } from "./types";
import {
  formatHour,
  formatHourNumber,
  formatMeters,
  formatMetersPerSecond,
  formatMinuteTime,
  formatPercent,
  formatPrecipitation,
  formatTemp,
  formatTimelineTime,
  formatWindDirection,
  getSunEventLabel,
} from "./weatherFormatters";

describe("weatherFormatters", () => {
  it("formats weather measurements with fallbacks", () => {
    expect(formatTemp(21.6)).toBe("22℃");
    expect(formatTemp()).toBe("--℃");
    expect(formatPercent(54.4)).toBe("54%");
    expect(formatPercent()).toBe("--%");
    expect(formatMetersPerSecond(36)).toBe("10 m/s");
    expect(formatMetersPerSecond()).toBe("--");
    expect(formatMeters(18)).toBe("5m");
    expect(formatMeters()).toBe("--");
    expect(formatPrecipitation(2)).toBe("2 mm");
    expect(formatPrecipitation(2.25)).toBe("2.3 mm");
    expect(formatPrecipitation()).toBe("--");
  });

  it("formats wind direction and sun event labels", () => {
    expect(formatWindDirection()).toBe("--");
    expect(formatWindDirection(0)).toBe("北");
    expect(formatWindDirection(45)).toBe("北東");
    expect(formatWindDirection(225)).toBe("南西");
    expect(getSunEventLabel("sunrise")).toBe("日の出");
    expect(getSunEventLabel("sunset")).toBe("日の入");
  });

  it("formats valid and invalid times", () => {
    expect(formatHour("not-a-date")).toBe("--");
    expect(formatHourNumber("not-a-date")).toBe("--");
    expect(formatMinuteTime("not-a-date")).toBe("--");
    expect(formatHour("2026-05-20T08:30:00+09:00")).not.toBe("--");
    expect(formatHourNumber("2026-05-20T08:30:00+09:00")).not.toBe("--");
    expect(formatMinuteTime("2026-05-20T08:30:00+09:00")).not.toBe("--");
  });

  it("formats timeline points by kind", () => {
    const hourly: WeatherTimelinePoint = { kind: "hourly", point: { tempC: 22, time: "2026-05-20T08:00:00+09:00" } };
    const sunEvent: WeatherTimelinePoint = { event: { event: "sunrise", time: "2026-05-20T04:32:00+09:00" }, kind: "sunEvent" };

    expect(formatTimelineTime(hourly)).not.toBe("--");
    expect(formatTimelineTime(sunEvent)).not.toBe("--");
  });
});
