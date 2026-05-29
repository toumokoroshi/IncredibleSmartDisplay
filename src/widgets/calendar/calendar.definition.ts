import { z } from "zod";

import { createCalendarService } from "../../services/calendar/calendarService";
import { CalendarWidget } from "./CalendarWidget";
import type { CalendarData } from "./types";

const calendarBaseSettingsSchema = z.object({
  daysAhead: z.number().int().nonnegative(),
  maxTodayEvents: z.number().int().nonnegative(),
  maxTomorrowEvents: z.number().int().nonnegative(),
  showAllDayEvents: z.boolean(),
});

export const calendarSettingsSchema = z.discriminatedUnion("provider", [
  calendarBaseSettingsSchema.extend({
    provider: z.literal("mock"),
  }),
  calendarBaseSettingsSchema.extend({
    cacheBusterIntervalSec: z.number().int().positive().optional(),
    provider: z.literal("staticJson"),
    url: z.string().min(1),
  }),
]);

export const calendarDefinition = {
  type: "calendar",
  component: CalendarWidget,
  settingsSchema: calendarSettingsSchema,
  createService: createCalendarService,
  fallbackArea: "main-right",
  defaultRefreshIntervalSec: 600,
  cacheTtlHours: 24,
  isEmpty: (data: CalendarData) => data.items.length === 0,
  detailDisplayMode: "calendar",
} as const;
