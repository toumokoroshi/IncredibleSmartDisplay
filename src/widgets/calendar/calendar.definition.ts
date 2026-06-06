import { z } from "zod";

import { createCalendarService } from "../../services/calendar/calendarService";
import { CalendarWidget } from "./CalendarWidget";
import type { CalendarData, CalendarSettings } from "./types";

const calendarBaseSettingsSchema = z.object({
  daysAhead: z.number().int().nonnegative(),
  maxTodayEvents: z.number().int().nonnegative(),
  maxTomorrowEvents: z.number().int().nonnegative(),
  showAllDayEvents: z.boolean(),
});

export const calendarSettingsSchema = z.discriminatedUnion("provider", [
  calendarBaseSettingsSchema.extend({
    provider: z.literal("localDate"),
  }),
  calendarBaseSettingsSchema.extend({
    provider: z.literal("mock"),
  }),
  calendarBaseSettingsSchema.extend({
    cacheBusterIntervalSec: z.number().int().positive().optional(),
    provider: z.literal("staticJson"),
    url: z.string().min(1),
  }),
  calendarBaseSettingsSchema.extend({
    privateData: z.boolean().optional(),
    provider: z.literal("workerJson"),
    url: z.string().min(1),
  }),
]);

const calendarDataSchema: z.ZodType<CalendarData> = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      startsAt: z.string().refine((value) => Number.isNaN(Date.parse(value)) === false),
      endsAt: z
        .string()
        .refine((value) => Number.isNaN(Date.parse(value)) === false)
        .optional(),
      isAllDay: z.boolean().optional(),
      calendarName: z.string().optional(),
      location: z.string().optional(),
    }),
  ),
});

export const calendarDefinition = {
  type: "calendar",
  component: CalendarWidget,
  settingsSchema: calendarSettingsSchema,
  createService: createCalendarService,
  fallbackArea: "main-right",
  defaultRefreshIntervalSec: 600,
  cacheTtlHours: 24,
  validateData: (data: unknown): data is CalendarData => calendarDataSchema.safeParse(data).success,
  isEmpty: () => false,
  getCachePolicy: (settings: CalendarSettings) => (settings.provider === "workerJson" && settings.privateData === true ? "privateNoStore" : "publicPersistent"),
  detailDisplayMode: "calendar",
} as const;
