import type { CalendarData } from "../../widgets/calendar";

export const mockCalendarData: CalendarData = {
  items: [
    {
      id: "standup",
      title: "Standup",
      startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    },
    {
      id: "dinner",
      title: "Dinner",
      startsAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    },
  ],
};
