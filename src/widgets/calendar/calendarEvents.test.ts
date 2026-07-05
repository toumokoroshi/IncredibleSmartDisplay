import { describe, expect, it } from "vitest";

import { formatEventTime, formatRelativeStart, getEventsForDay, getMonthDays, getNextEvent, getWeekDays } from "./calendarEvents";
import type { CalendarEvent } from "./calendarEvents";

function event(overrides: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: "event",
    title: "予定",
    startsAt: "2026-05-19T10:00:00+09:00",
    ...overrides,
  };
}

describe("formatEventTime", () => {
  it("shows 終日 for all-day events", () => {
    expect(formatEventTime(event({ isAllDay: true }))).toBe("終日");
  });

  it("formats a time for timed events", () => {
    expect(formatEventTime(event({ startsAt: "2026-05-19T09:05:00+09:00" }))).toBe("09:05");
  });
});

describe("formatRelativeStart", () => {
  it("shows 本日 for all-day events regardless of now", () => {
    expect(formatRelativeStart(event({ isAllDay: true }), new Date("2026-05-19T08:00:00+09:00"))).toBe("本日");
  });

  it("shows minutes under an hour away", () => {
    const now = new Date("2026-05-19T09:45:00+09:00");
    expect(formatRelativeStart(event({ startsAt: "2026-05-19T10:00:00+09:00" }), now)).toBe("あと15分");
  });

  it("shows whole hours with no remainder at the 60-minute boundary", () => {
    const now = new Date("2026-05-19T09:00:00+09:00");
    expect(formatRelativeStart(event({ startsAt: "2026-05-19T10:00:00+09:00" }), now)).toBe("あと1時間");
  });

  it("shows hours and minutes past the hour boundary", () => {
    const now = new Date("2026-05-19T08:30:00+09:00");
    expect(formatRelativeStart(event({ startsAt: "2026-05-19T10:00:00+09:00" }), now)).toBe("あと1時間30分");
  });

  it("clamps a past start time to あと0分", () => {
    const now = new Date("2026-05-19T10:30:00+09:00");
    expect(formatRelativeStart(event({ startsAt: "2026-05-19T10:00:00+09:00" }), now)).toBe("あと0分");
  });
});

describe("getEventsForDay", () => {
  it("filters events to the same calendar day", () => {
    const items = [event({ id: "a", startsAt: "2026-05-19T01:00:00+09:00" }), event({ id: "b", startsAt: "2026-05-20T01:00:00+09:00" })];
    expect(getEventsForDay(items, new Date("2026-05-19T12:00:00+09:00")).map((item) => item.id)).toEqual(["a"]);
  });
});

describe("getNextEvent", () => {
  it("prioritizes the soonest upcoming timed event over an all-day event today", () => {
    const now = new Date("2026-05-19T08:00:00+09:00");
    const items = [event({ id: "all-day", isAllDay: true, startsAt: "2026-05-19T00:00:00+09:00" }), event({ id: "timed", startsAt: "2026-05-19T09:00:00+09:00" })];
    expect(getNextEvent(items, now)?.id).toBe("timed");
  });

  it("falls back to an all-day event today when no timed event remains", () => {
    const now = new Date("2026-05-19T23:00:00+09:00");
    const items = [event({ id: "past-timed", startsAt: "2026-05-19T08:00:00+09:00" }), event({ id: "all-day", isAllDay: true, startsAt: "2026-05-19T00:00:00+09:00" })];
    expect(getNextEvent(items, now)?.id).toBe("all-day");
  });

  it("ignores an all-day event on a different day", () => {
    const now = new Date("2026-05-19T23:00:00+09:00");
    const items = [event({ id: "tomorrow-all-day", isAllDay: true, startsAt: "2026-05-20T00:00:00+09:00" })];
    expect(getNextEvent(items, now)).toBeUndefined();
  });

  it("picks the earliest of multiple upcoming timed events", () => {
    const now = new Date("2026-05-19T08:00:00+09:00");
    const items = [event({ id: "later", startsAt: "2026-05-19T12:00:00+09:00" }), event({ id: "sooner", startsAt: "2026-05-19T09:00:00+09:00" })];
    expect(getNextEvent(items, now)?.id).toBe("sooner");
  });
});

describe("getWeekDays", () => {
  it("returns 7 days starting from Sunday of the anchor's week", () => {
    const days = getWeekDays(new Date("2026-05-19T12:00:00+09:00"));
    expect(days).toHaveLength(7);
    expect(days[0].getDay()).toBe(0);
    expect(days[0].getDate()).toBe(17);
    expect(days[6].getDate()).toBe(23);
  });
});

describe("getMonthDays", () => {
  it("returns a 35-cell grid starting on the Monday on/before the 1st", () => {
    const days = getMonthDays(new Date("2026-05-19T12:00:00+09:00"));
    expect(days).toHaveLength(35);
    expect(days[0].getDay()).toBe(1);
    expect(days[0].getMonth()).toBe(3);
    expect(days[0].getDate()).toBe(27);
  });

  it("starts on the 1st itself when the month begins on a Monday", () => {
    const days = getMonthDays(new Date("2026-06-15T12:00:00+09:00"));
    expect(days[0].getDay()).toBe(1);
    expect(days[0].getMonth()).toBe(5);
    expect(days[0].getDate()).toBe(1);
  });
});
