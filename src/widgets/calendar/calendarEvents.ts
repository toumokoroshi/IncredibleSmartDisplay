import { addDays, formatTimeLabel, isSameDay, startOfDay } from "../../utils/date";
import type { CalendarData } from "./types";

export type CalendarEvent = CalendarData["items"][number];

export function formatEventTime(event: CalendarEvent) {
  if (event.isAllDay) {
    return "終日";
  }
  return formatTimeLabel(new Date(event.startsAt));
}

export function formatRelativeStart(event: CalendarEvent, now: Date) {
  if (event.isAllDay) {
    return "本日";
  }

  const minutes = Math.max(0, Math.round((new Date(event.startsAt).getTime() - now.getTime()) / 60000));
  if (minutes < 60) {
    return `あと${minutes}分`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes === 0 ? `あと${hours}時間` : `あと${hours}時間${remainingMinutes}分`;
}

export function getEventsForDay(items: CalendarEvent[], date: Date) {
  return items.filter((item) => isSameDay(new Date(item.startsAt), date));
}

export function getNextEvent(items: CalendarEvent[], now: Date) {
  const upcomingTimedEvent = items
    .filter((item) => !item.isAllDay && new Date(item.startsAt).getTime() >= now.getTime())
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())[0];

  if (upcomingTimedEvent) {
    return upcomingTimedEvent;
  }

  return items
    .filter((item) => item.isAllDay && isSameDay(new Date(item.startsAt), now))
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())[0];
}

export function getMonthDays(anchor: Date) {
  const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
  const firstVisibleDay = addDays(firstOfMonth, -mondayOffset);
  return Array.from({ length: 35 }, (_, index) => addDays(firstVisibleDay, index));
}

export function getWeekDays(anchor: Date) {
  const firstVisibleDay = addDays(startOfDay(anchor), -anchor.getDay());
  return Array.from({ length: 7 }, (_, index) => addDays(firstVisibleDay, index));
}
