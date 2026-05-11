export type CalendarSettings = {
  provider: "mock";
  daysAhead: number;
  maxTodayEvents: number;
  maxTomorrowEvents: number;
  showAllDayEvents: boolean;
};

export type CalendarData = {
  items: Array<{
    id: string;
    title: string;
    startsAt: string;
    isAllDay?: boolean;
  }>;
};
