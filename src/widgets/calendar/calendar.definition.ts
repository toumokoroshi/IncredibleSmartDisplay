import { z } from "zod";

import { createCalendarService } from "../../services/calendar/calendarService";
import { CalendarWidget } from "./CalendarWidget";

export const calendarSettingsSchema = z.object({
  provider: z.literal("mock"),
  daysAhead: z.number().int().nonnegative(),
  maxTodayEvents: z.number().int().nonnegative(),
  maxTomorrowEvents: z.number().int().nonnegative(),
  showAllDayEvents: z.boolean(),
});

export const calendarDefinition = {
  type: "calendar",
  component: CalendarWidget,
  settingsSchema: calendarSettingsSchema,
  createService: createCalendarService,
  fallbackArea: "main-right",
  defaultRefreshIntervalSec: 600,
} as const;
