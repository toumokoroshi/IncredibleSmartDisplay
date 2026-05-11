import type { WidgetService } from "../../types/widget";
import { mockCalendarData } from "../../test/mocks/calendar";
import type { CalendarData, CalendarSettings } from "../../widgets/calendar";

export function createCalendarService(): WidgetService<CalendarSettings, CalendarData> {
  return {
    async fetch() {
      return mockCalendarData;
    },
  };
}
