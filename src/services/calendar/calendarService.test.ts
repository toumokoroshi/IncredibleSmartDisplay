import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createCalendarService } from "./calendarService";

describe("createCalendarService", () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-30T00:10:30.000+09:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns filtered mock calendar data", async () => {
    const result = await createCalendarService().fetch({
      daysAhead: 2,
      maxTodayEvents: 4,
      maxTomorrowEvents: 2,
      provider: "mock",
      showAllDayEvents: true,
    });

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.every((item) => typeof item.startsAt === "string")).toBe(true);
  });

  it("returns local date calendar data without fetching personal events", async () => {
    const result = await createCalendarService().fetch({
      daysAhead: 7,
      maxTodayEvents: 0,
      maxTomorrowEvents: 0,
      provider: "localDate",
      showAllDayEvents: false,
    });

    expect(fetch).not.toHaveBeenCalled();
    expect(result).toEqual({ items: [] });
  });

  it("fetches and validates static JSON calendar data", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({
        items: [
          { id: "today-1", title: "Today 1", startsAt: "2026-05-30T09:00:00+09:00", calendarName: "Home" },
          { id: "today-2", title: "Today 2", startsAt: "2026-05-30T10:00:00+09:00", calendarName: "Home" },
          { id: "tomorrow-1", title: "Tomorrow", startsAt: "2026-05-31T10:00:00+09:00", calendarName: "Work" },
          { id: "hidden-all-day", title: "Hidden", startsAt: "2026-05-30T00:00:00+09:00", isAllDay: true },
          { id: "outside-range", title: "Outside", startsAt: "2026-06-03T10:00:00+09:00" },
        ],
      }),
      ok: true,
      status: 200,
    } as Response);

    const result = await createCalendarService().fetch({
      cacheBusterIntervalSec: 600,
      daysAhead: 1,
      maxTodayEvents: 1,
      maxTomorrowEvents: 2,
      provider: "staticJson",
      showAllDayEvents: false,
      url: "/data/calendar.json",
    });

    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/^\/data\/calendar\.json\?v=\d+$/));
    expect(result.items.map((item) => item.id)).toEqual(["today-1", "tomorrow-1"]);
  });

  it("fetches and validates worker JSON calendar data", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({
        items: [
          { id: "today-1", title: "Today 1", startsAt: "2026-05-30T09:00:00+09:00", calendarName: "Home" },
          { id: "tomorrow-1", title: "Tomorrow", startsAt: "2026-05-31T10:00:00+09:00", calendarName: "Work" },
          { id: "outside-range", title: "Outside", startsAt: "2026-06-03T10:00:00+09:00" },
        ],
      }),
      ok: true,
      status: 200,
    } as Response);

    const result = await createCalendarService().fetch({
      daysAhead: 1,
      maxTodayEvents: 4,
      maxTomorrowEvents: 2,
      provider: "workerJson",
      showAllDayEvents: true,
      url: "https://example.test/calendar",
    });

    expect(fetch).toHaveBeenCalledWith("https://example.test/calendar", {
      cache: "no-store",
      method: "GET",
    });
    expect(result.items.map((item) => item.id)).toEqual(["today-1", "tomorrow-1"]);
  });

  it("rejects malformed static JSON calendar data", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ items: [{ id: "missing-start", title: "Broken" }] }),
      ok: true,
      status: 200,
    } as Response);

    await expect(
      createCalendarService().fetch({
        daysAhead: 2,
        maxTodayEvents: 4,
        maxTomorrowEvents: 2,
        provider: "staticJson",
        showAllDayEvents: true,
        url: "/data/calendar.json",
      }),
    ).rejects.toThrow("Invalid calendar JSON");
  });

  it("rejects failed static JSON responses", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({}),
      ok: false,
      status: 404,
    } as Response);

    await expect(
      createCalendarService().fetch({
        daysAhead: 2,
        maxTodayEvents: 4,
        maxTomorrowEvents: 2,
        provider: "staticJson",
        showAllDayEvents: true,
        url: "/data/calendar.json",
      }),
    ).rejects.toThrow("Failed to fetch calendar JSON: 404");
  });

  it("rejects failed worker JSON calendar responses", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({}),
      ok: false,
      status: 401,
    } as Response);

    await expect(
      createCalendarService().fetch({
        daysAhead: 2,
        maxTodayEvents: 4,
        maxTomorrowEvents: 2,
        provider: "workerJson",
        showAllDayEvents: true,
        url: "https://example.test/calendar",
      }),
    ).rejects.toMatchObject({ code: "AUTH_ERROR", retryable: false });
  });
});
