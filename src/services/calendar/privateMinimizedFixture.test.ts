import { describe, expect, it } from "vitest";

import { calendarDefinition } from "../../widgets/calendar/calendar.definition";
import { privateMinimizedCalendarData } from "./privateMinimizedFixture";

describe("privateMinimizedCalendarData", () => {
  it("matches the CalendarData contract without exposing private calendar fields", () => {
    expect(calendarDefinition.validateData(privateMinimizedCalendarData)).toBe(true);

    for (const event of privateMinimizedCalendarData.items) {
      expect(event.title).toBe("予定あり");
      expect("location" in event).toBe(false);
      expect("calendarName" in event).toBe(false);
      expect(Number.isNaN(Date.parse(event.startsAt))).toBe(false);
      expect(event.endsAt).toBeDefined();
      expect(Number.isNaN(Date.parse(event.endsAt ?? ""))).toBe(false);
    }
  });
});
