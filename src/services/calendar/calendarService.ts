import type { WidgetService } from "../../types/widget";
import { appendCacheBuster } from "../../utils/cacheBuster";
import { resolvePublicAssetPath } from "../../utils/publicAssetPath";
import { mockCalendarData } from "./mockData";
import type { CalendarData, CalendarSettings } from "../../widgets/calendar";

type CalendarEvent = CalendarData["items"][number];

function optionalString(value: unknown) {
  return value === undefined || typeof value === "string";
}

function isCalendarData(value: unknown): value is CalendarData {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const items = (value as { items?: unknown }).items;
  return Array.isArray(items) && items.every(isCalendarEvent);
}

function isCalendarEvent(value: unknown): value is CalendarEvent {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const event = value as Partial<Record<keyof CalendarEvent, unknown>>;
  return (
    typeof event.id === "string" &&
    typeof event.title === "string" &&
    typeof event.startsAt === "string" &&
    Number.isNaN(Date.parse(event.startsAt)) === false &&
    optionalString(event.endsAt) &&
    (event.endsAt === undefined || Number.isNaN(Date.parse(event.endsAt)) === false) &&
    (event.isAllDay === undefined || typeof event.isAllDay === "boolean") &&
    optionalString(event.calendarName) &&
    optionalString(event.location)
  );
}

function startOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function isSameDay(left: Date, right: Date) {
  return startOfDay(left).getTime() === startOfDay(right).getTime();
}

function applyCalendarSettings(data: CalendarData, settings: CalendarSettings): CalendarData {
  const today = startOfDay(new Date());
  const lastVisibleDay = addDays(today, settings.daysAhead);

  const tomorrow = addDays(today, 1);
  const countByDay = new Map<string, number>();
  const items = data.items
    .filter((item) => settings.showAllDayEvents || item.isAllDay !== true)
    .filter((item) => {
      const eventDay = startOfDay(new Date(item.startsAt));
      return eventDay.getTime() >= today.getTime() && eventDay.getTime() <= lastVisibleDay.getTime();
    })
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())
    .filter((item) => {
      const startsAt = new Date(item.startsAt);
      const maxItems = isSameDay(startsAt, today) ? settings.maxTodayEvents : isSameDay(startsAt, tomorrow) ? settings.maxTomorrowEvents : Number.POSITIVE_INFINITY;
      const key = startOfDay(startsAt).toISOString();
      const currentCount = countByDay.get(key) ?? 0;
      countByDay.set(key, currentCount + 1);
      return currentCount < maxItems;
    });

  return { items };
}

async function fetchStaticJsonCalendar(settings: Extract<CalendarSettings, { provider: "staticJson" }>) {
  const response = await fetch(appendCacheBuster(resolvePublicAssetPath(settings.url), settings.cacheBusterIntervalSec));

  if (!response.ok) {
    throw new Error(`Failed to fetch calendar JSON: ${response.status}`);
  }

  const payload: unknown = await response.json();
  if (!isCalendarData(payload)) {
    throw new Error("Invalid calendar JSON");
  }

  return applyCalendarSettings(payload, settings);
}

export function createCalendarService(): WidgetService<CalendarSettings, CalendarData> {
  return {
    async fetch(settings) {
      if (settings.provider === "staticJson") {
        return fetchStaticJsonCalendar(settings);
      }

      return applyCalendarSettings(mockCalendarData, settings);
    },
  };
}
