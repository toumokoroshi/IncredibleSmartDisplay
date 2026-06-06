type CalendarBaseSettings = {
  daysAhead: number;
  maxTodayEvents: number;
  maxTomorrowEvents: number;
  showAllDayEvents: boolean;
};

export type MockCalendarSettings = CalendarBaseSettings & {
  provider: "mock";
};

export type LocalDateCalendarSettings = CalendarBaseSettings & {
  provider: "localDate";
};

export type StaticJsonCalendarSettings = CalendarBaseSettings & {
  provider: "staticJson";
  url: string;
  cacheBusterIntervalSec?: number;
};

export type WorkerJsonCalendarSettings = CalendarBaseSettings & {
  privateData?: boolean;
  provider: "workerJson";
  url: string;
};

export type CalendarSettings = LocalDateCalendarSettings | MockCalendarSettings | StaticJsonCalendarSettings | WorkerJsonCalendarSettings;

export type CalendarData = {
  items: Array<{
    id: string;
    title: string;
    startsAt: string;
    endsAt?: string;
    isAllDay?: boolean;
    calendarName?: string;
    location?: string;
  }>;
};
