import { describe, expect, it } from "vitest";

import {
  addDays,
  formatDistanceToNowLabel,
  formatHeaderDateLabel,
  formatHourMinuteLabel,
  formatMonthTitle,
  formatScheduleLabel,
  formatShortWeekdayLabel,
  formatTimeLabel,
  getDaysInMonth,
  isSameDay,
  startOfDay,
} from "./date";

describe("formatTimeLabel", () => {
  it("formats hour and minute in ja-JP", () => {
    expect(formatTimeLabel(new Date("2026-05-19T07:05:00+09:00"))).toBe("07:05");
  });
});

describe("formatHourMinuteLabel", () => {
  it("formats a 2-digit 24-hour label from an ISO string", () => {
    expect(formatHourMinuteLabel("2026-05-19T07:05:00+09:00")).toBe("07:05");
  });

  it("formats a 2-digit 24-hour label from a Date", () => {
    expect(formatHourMinuteLabel(new Date("2026-05-19T23:05:00+09:00"))).toBe("23:05");
  });
});

describe("formatShortWeekdayLabel", () => {
  it("returns the single-character Japanese weekday", () => {
    expect(formatShortWeekdayLabel(new Date("2026-05-31T00:00:00+09:00"))).toBe("日");
  });
});

describe("formatHeaderDateLabel", () => {
  it("formats month/day with weekday", () => {
    expect(formatHeaderDateLabel(new Date("2026-05-31T00:00:00+09:00"))).toBe("5月31日(日)");
  });
});

describe("formatDistanceToNowLabel", () => {
  it("reports たった今 for under a minute", () => {
    expect(formatDistanceToNowLabel(new Date(Date.now() - 10_000).toISOString())).toBe("たった今");
  });

  it("reports minutes for under an hour", () => {
    expect(formatDistanceToNowLabel(new Date(Date.now() - 5 * 60_000).toISOString())).toBe("5分前");
  });

  it("reports hours for an hour or more", () => {
    expect(formatDistanceToNowLabel(new Date(Date.now() - 3 * 60 * 60_000).toISOString())).toBe("3時間前");
  });
});

describe("formatScheduleLabel", () => {
  it("formats month/day/hour/minute", () => {
    expect(formatScheduleLabel("2026-05-19T07:05:00+09:00")).toBe("5/19 07:05");
  });
});

describe("startOfDay", () => {
  it("zeroes the time components", () => {
    const result = startOfDay(new Date("2026-05-19T23:59:59+09:00"));
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
    expect(result.getDate()).toBe(19);
  });
});

describe("addDays", () => {
  it("adds a positive number of days", () => {
    const result = addDays(new Date("2026-05-19T07:00:00+09:00"), 3);
    expect(result.getDate()).toBe(22);
  });

  it("subtracts with a negative number of days", () => {
    const result = addDays(new Date("2026-05-01T07:00:00+09:00"), -1);
    expect(result.getMonth()).toBe(3);
    expect(result.getDate()).toBe(30);
  });
});

describe("isSameDay", () => {
  it("is true for the same calendar day at different times", () => {
    expect(isSameDay(new Date("2026-05-19T00:30:00+09:00"), new Date("2026-05-19T23:30:00+09:00"))).toBe(true);
  });

  it("is false across a day boundary", () => {
    expect(isSameDay(new Date("2026-05-19T23:59:00+09:00"), new Date("2026-05-20T00:01:00+09:00"))).toBe(false);
  });
});

describe("getDaysInMonth", () => {
  it("returns 28 for a non-leap February", () => {
    expect(getDaysInMonth(new Date("2026-02-10T00:00:00+09:00"))).toBe(28);
  });

  it("returns 31 for a 31-day month", () => {
    expect(getDaysInMonth(new Date("2026-05-10T00:00:00+09:00"))).toBe(31);
  });
});

describe("formatMonthTitle", () => {
  it("formats a long month name with the year", () => {
    expect(formatMonthTitle(new Date("2026-05-19T00:00:00+09:00"))).toBe("2026年5月");
  });
});
