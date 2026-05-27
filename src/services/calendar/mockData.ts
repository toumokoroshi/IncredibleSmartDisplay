import type { CalendarData } from "../../widgets/calendar";

function atOffset(days: number, hours: number, minutes = 0) {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export const mockCalendarData: CalendarData = {
  items: [
    {
      calendarName: "Work",
      endsAt: atOffset(0, 10, 15),
      id: "weekly-review",
      title: "週次レビューと買い出し前の確認",
      startsAt: atOffset(0, 9, 30),
    },
    {
      calendarName: "Home",
      endsAt: atOffset(0, 13, 0),
      id: "lunch",
      title: "昼休み",
      startsAt: atOffset(0, 12, 15),
    },
    {
      calendarName: "Family",
      endsAt: atOffset(0, 19, 0),
      id: "vet-check",
      title: "動物病院の予約確認",
      startsAt: atOffset(0, 18, 30),
    },
    {
      calendarName: "Home",
      id: "trash-day",
      isAllDay: true,
      title: "燃えるごみ",
      startsAt: atOffset(0, 0, 0),
    },
    {
      calendarName: "Home",
      endsAt: atOffset(1, 9, 0),
      id: "departure-check",
      title: "出発前チェック",
      startsAt: atOffset(1, 8, 45),
    },
    {
      calendarName: "Work",
      endsAt: atOffset(1, 11, 0),
      id: "project-sync",
      title: "プロジェクト定例",
      startsAt: atOffset(1, 10, 0),
    },
    {
      calendarName: "Family",
      id: "shopping",
      isAllDay: true,
      title: "掃除と買い出し",
      startsAt: atOffset(2, 0, 0),
    },
    {
      calendarName: "Work",
      endsAt: atOffset(4, 9, 30),
      id: "morning-meeting",
      title: "朝会",
      startsAt: atOffset(4, 9, 0),
    },
    {
      calendarName: "Work",
      endsAt: atOffset(4, 14, 0),
      id: "design-review",
      title: "設計レビュー",
      startsAt: atOffset(4, 13, 0),
    },
  ],
};
