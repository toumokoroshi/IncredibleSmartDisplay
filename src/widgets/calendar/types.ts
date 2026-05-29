type CalendarBaseSettings = {
  daysAhead: number;
  maxTodayEvents: number;
  maxTomorrowEvents: number;
  showAllDayEvents: boolean;
};

export type MockCalendarSettings = CalendarBaseSettings & {
  provider: "mock";
};

export type StaticJsonCalendarSettings = CalendarBaseSettings & {
  provider: "staticJson";
  url: string;
  cacheBusterIntervalSec?: number;
};

export type CalendarSettings = MockCalendarSettings | StaticJsonCalendarSettings;

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
