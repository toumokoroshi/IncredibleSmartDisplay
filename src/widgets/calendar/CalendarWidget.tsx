import { useMemo, useState } from "react";

import { Card } from "../../components/Card";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { MaterialSymbolIcon } from "../../components/MaterialSymbolIcon";
import { StaleBadge } from "../../components/StaleBadge";
import { addDays, formatMonthTitle, formatShortWeekdayLabel, formatTimeLabel, getDaysInMonth, isSameDay, startOfDay } from "../../utils/date";
import type { WidgetProps } from "../../types/widget";
import type { CalendarData, CalendarSettings } from "./types";

type CalendarEvent = CalendarData["items"][number];
type CalendarViewMode = "week" | "month";

function formatDayName(date: Date) {
  return formatShortWeekdayLabel(date);
}

function formatLongDayName(date: Date) {
  return `${formatShortWeekdayLabel(date)}曜日`;
}

function formatDayNumber(date: Date) {
  return String(date.getDate());
}

function formatShortDate(date: Date) {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatEventTime(event: CalendarEvent) {
  if (event.isAllDay) {
    return "終日";
  }
  return formatTimeLabel(new Date(event.startsAt));
}

function formatRelativeStart(event: CalendarEvent, now: Date) {
  if (event.isAllDay) {
    return "本日";
  }

  const minutes = Math.max(0, Math.round((new Date(event.startsAt).getTime() - now.getTime()) / 60000));
  if (minutes < 60) {
    return `あと${minutes}分`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes === 0 ? `あと${hours}時間` : `あと${hours}時間${remainingMinutes}分`;
}

function getEventsForDay(items: CalendarEvent[], date: Date) {
  return items.filter((item) => isSameDay(new Date(item.startsAt), date));
}

function getNextEvent(items: CalendarEvent[], now: Date) {
  const upcomingTimedEvent = items
    .filter((item) => !item.isAllDay && new Date(item.startsAt).getTime() >= now.getTime())
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())[0];

  if (upcomingTimedEvent) {
    return upcomingTimedEvent;
  }

  return items
    .filter((item) => item.isAllDay && isSameDay(new Date(item.startsAt), now))
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())[0];
}

function getMonthDays(anchor: Date) {
  const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
  const firstVisibleDay = addDays(firstOfMonth, -mondayOffset);
  return Array.from({ length: 35 }, (_, index) => addDays(firstVisibleDay, index));
}

function getWeekDays(anchor: Date) {
  const firstVisibleDay = addDays(startOfDay(anchor), -anchor.getDay());
  return Array.from({ length: 7 }, (_, index) => addDays(firstVisibleDay, index));
}

export function CalendarWidget({ config, data, error, isEmpty, isHighlighted, status }: WidgetProps<CalendarSettings, CalendarData>) {
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");
  const now = useMemo(() => new Date(), []);

  return (
    <Card className={`flex flex-col ${isHighlighted ? "ring-2 ring-cyan-400/60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="widget-heading flex min-w-0 items-center gap-3">
          <span className="widget-heading-icon">
            <MaterialSymbolIcon name="calendar_month" />
          </span>
          <p className="truncate text-lg uppercase tracking-[0.2em] text-slate-400">{config.title}</p>
        </div>
        {status === "stale" ? <StaleBadge /> : null}
      </div>
      {status === "loading" ? <LoadingState /> : null}
      {status === "error" ? <ErrorState error={error} /> : null}
      {data && status !== "error" && status !== "loading" && !isEmpty ? (
        isHighlighted ? (
          <CalendarDetail data={data} now={now} viewMode={viewMode} onViewModeChange={setViewMode} />
        ) : (
          <CalendarQuickLook data={data} now={now} />
        )
      ) : null}
    </Card>
  );
}

function CalendarQuickLook({ data, now }: { data: CalendarData; now: Date }) {
  const nextEvent = getNextEvent(data.items, now);
  const upcoming = data.items
    .filter((item) => nextEvent === undefined || item.id !== nextEvent.id)
    .filter((item) => item.isAllDay || new Date(item.startsAt).getTime() >= now.getTime())
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())
    .slice(0, 2);

  if (!nextEvent) {
    return <LocalDateQuickLook now={now} />;
  }

  return (
    <div className="mt-4 grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] gap-3">
      <section className="grid min-h-0 content-center overflow-hidden rounded-lg border border-[color:var(--item-stroke)] bg-[var(--item-bg)] px-4 py-4">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">次の予定</p>
        <p className="mt-2 text-[42px] font-bold leading-none text-blue-600">{formatEventTime(nextEvent)}</p>
        <p className="mt-3 line-clamp-2 text-[25px] font-semibold leading-tight text-slate-950">{nextEvent.title}</p>
        <p className="mt-2 truncate text-base font-semibold text-slate-500">{`${formatRelativeStart(nextEvent, now)}${nextEvent.calendarName ? ` ・ ${nextEvent.calendarName}` : ""}`}</p>
      </section>
      {upcoming.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {upcoming.map((item) => (
            <section key={item.id} className="min-w-0 rounded-lg bg-slate-100 px-3 py-2">
              <time className="text-sm font-bold text-cyan-700">{formatEventTime(item)}</time>
              <p className="mt-1 truncate text-base font-semibold text-slate-700">{item.title}</p>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function LocalDateQuickLook({ now }: { now: Date }) {
  const tomorrow = addDays(now, 1);
  const weekDays = getWeekDays(now);
  const daysInMonth = getDaysInMonth(now);
  const dayOfMonth = now.getDate();
  const daysLeft = daysInMonth - dayOfMonth;

  return (
    <div className="mt-4 grid min-h-0 flex-1 grid-rows-[auto_auto_minmax(0,1fr)] gap-3">
      <section className="grid content-start overflow-hidden rounded-lg border border-[color:var(--item-stroke)] bg-[var(--item-bg)] px-4 py-4">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">今日</p>
        <p className="mt-2 text-[36px] font-bold leading-none text-blue-600">{formatShortDate(now)}</p>
        <p className="mt-2 truncate text-[22px] font-semibold leading-tight text-slate-950">{formatLongDayName(now)}</p>
        <p className="mt-2 truncate text-base font-semibold text-slate-500">{`明日: ${formatShortDate(tomorrow)}(${formatDayName(tomorrow)})`}</p>
      </section>
      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((day) => (
          <section key={day.toISOString()} className={isSameDay(day, now) ? "min-w-0 rounded-lg bg-blue-100 px-2 py-2 text-center" : "min-w-0 rounded-lg bg-slate-100 px-2 py-2 text-center"}>
            <p className="truncate text-xs font-bold uppercase tracking-[0.08em] text-slate-500">{formatDayName(day)}</p>
            <p className="mt-1 text-lg font-bold leading-none text-slate-900">{formatDayNumber(day)}</p>
          </section>
        ))}
      </div>
      <section className="calendar-quicklook-month grid min-h-0 content-center gap-2 overflow-hidden rounded-lg border border-[color:var(--item-stroke)] bg-[var(--item-bg)] p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{formatMonthTitle(now)}</p>
          <p className="shrink-0 text-xs font-bold text-slate-500">{`${dayOfMonth}日目 / ${daysInMonth}日`}</p>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-blue-600" style={{ width: `${(dayOfMonth / daysInMonth) * 100}%` }} />
        </div>
        <p className="truncate text-sm font-semibold text-slate-500">{daysLeft > 0 ? `今月はあと${daysLeft}日` : "今月最終日"}</p>
      </section>
    </div>
  );
}

function CalendarDetail({
  data,
  now,
  onViewModeChange,
  viewMode,
}: {
  data: CalendarData;
  now: Date;
  onViewModeChange: (mode: CalendarViewMode) => void;
  viewMode: CalendarViewMode;
}) {
  const nextEvent = getNextEvent(data.items, now);
  const todayEvents = getEventsForDay(data.items, now);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(startOfDay(now), index));

  // Week and Month are Calendar-internal view modes so Dashboard display modes, registry entries, and future commands stay centered on one Calendar widget.
  return (
    <div className="widget-detail-root calendar-detail-root mt-3 grid min-h-0 flex-1 grid-rows-[52px_minmax(0,1fr)] gap-3">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">今日と今週</p>
          <p className="mt-1 truncate text-base font-semibold text-slate-500">{formatMonthTitle(now)}</p>
        </div>
        <div className="inline-flex min-h-11 rounded-full border border-[color:var(--panel-stroke)] bg-[var(--control-bg)] p-1" aria-label="カレンダー表示切替">
          <button
            type="button"
            className={viewMode === "week" ? "rounded-full bg-white px-4 text-sm font-bold text-blue-700 shadow-sm" : "rounded-full px-4 text-sm font-bold text-slate-500"}
            onClick={() => onViewModeChange("week")}
          >
            週
          </button>
          <button
            type="button"
            className={viewMode === "month" ? "rounded-full bg-white px-4 text-sm font-bold text-blue-700 shadow-sm" : "rounded-full px-4 text-sm font-bold text-slate-500"}
            onClick={() => onViewModeChange("month")}
          >
            月
          </button>
        </div>
      </div>
      {viewMode === "week" ? <CalendarWeekView data={data} nextEvent={nextEvent} now={now} todayEvents={todayEvents} weekDays={weekDays} /> : <CalendarMonthView data={data} nextEvent={nextEvent} now={now} />}
    </div>
  );
}

function CalendarWeekView({
  data,
  nextEvent,
  now,
  todayEvents,
  weekDays,
}: {
  data: CalendarData;
  nextEvent?: CalendarEvent;
  now: Date;
  todayEvents: CalendarEvent[];
  weekDays: Date[];
}) {
  return (
    <div className="grid min-h-0 grid-rows-[150px_minmax(0,1fr)] gap-3">
      <div className="grid min-h-0 grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-3">
        <section className="widget-detail-primary calendar-detail-next grid min-h-0 content-center overflow-hidden rounded-lg border border-[color:var(--item-stroke)] bg-[var(--item-bg)] p-4">
          {nextEvent ? (
            <div className="grid grid-cols-[132px_minmax(0,1fr)] items-center gap-4">
              <div className="grid min-h-[118px] place-items-center rounded-lg bg-blue-100 text-center text-blue-700">
                <div>
                  <strong className="block text-[34px] leading-none">{formatEventTime(nextEvent)}</strong>
                  <span className="mt-2 block text-sm font-bold">{formatRelativeStart(nextEvent, now)}</span>
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">次の予定</p>
                <h3 className="mt-2 truncate text-[30px] font-bold leading-tight text-slate-950">{nextEvent.title}</h3>
                <p className="mt-2 truncate text-base font-semibold text-slate-500">{nextEvent.calendarName ?? "カレンダー"}</p>
              </div>
            </div>
          ) : (
            <TodayDatePanel now={now} />
          )}
        </section>
        <section className="widget-detail-secondary calendar-detail-summary grid min-h-0 grid-cols-3 gap-2 rounded-lg border border-[color:var(--item-stroke)] bg-[var(--item-bg)] p-3">
          <Metric label="今日" value={String(todayEvents.length)} note="件の予定" />
          <Metric label="次の予定まで" value={nextEvent ? formatEventTime(nextEvent) : "--"} note="次の確定予定" />
          <Metric label="今週" value={String(data.items.length)} note="表示中の件数" />
        </section>
      </div>
      <section className="widget-detail-list calendar-detail-week grid min-h-0 grid-cols-7 gap-2 overflow-hidden">
        {weekDays.map((day) => (
          <WeekDayColumn key={day.toISOString()} date={day} events={getEventsForDay(data.items, day)} today={isSameDay(day, now)} />
        ))}
      </section>
    </div>
  );
}

function TodayDatePanel({ now }: { now: Date }) {
  const tomorrow = addDays(now, 1);

  return (
    <div className="grid grid-cols-[132px_minmax(0,1fr)] items-center gap-4">
      <div className="grid min-h-[118px] place-items-center rounded-lg bg-blue-100 text-center text-blue-700">
        <div>
          <strong className="block text-[34px] leading-none">{formatDayNumber(now)}</strong>
          <span className="mt-2 block text-sm font-bold">{formatDayName(now)}</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">今日</p>
        <h3 className="mt-2 truncate text-[30px] font-bold leading-tight text-slate-950">{formatShortDate(now)}</h3>
        <p className="mt-2 truncate text-base font-semibold text-slate-500">{`明日: ${formatShortDate(tomorrow)}(${formatDayName(tomorrow)})`}</p>
      </div>
    </div>
  );
}

function CalendarMonthView({ data, nextEvent, now }: { data: CalendarData; nextEvent?: CalendarEvent; now: Date }) {
  const monthDays = getMonthDays(now);
  const selectedDayEvents = getEventsForDay(data.items, now);

  return (
    <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_320px] gap-3">
      <section className="widget-detail-list calendar-detail-month grid min-h-0 grid-rows-[32px_minmax(0,1fr)] gap-2 rounded-lg border border-[color:var(--item-stroke)] bg-[var(--item-bg)] p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">{formatMonthTitle(now)}</p>
          <p className="text-sm font-semibold text-slate-500">選択日をハイライト表示</p>
        </div>
        <div className="grid min-h-0 grid-cols-7 grid-rows-[24px_repeat(5,minmax(0,1fr))] gap-1.5">
          {["月", "火", "水", "木", "金", "土", "日"].map((label) => (
            <p key={label} className="text-center text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
              {label}
            </p>
          ))}
          {monthDays.map((day) => (
            <MonthDayCell key={day.toISOString()} date={day} events={getEventsForDay(data.items, day)} muted={day.getMonth() !== now.getMonth()} today={isSameDay(day, now)} />
          ))}
        </div>
      </section>
      <aside className="widget-detail-secondary calendar-detail-selected-day grid min-h-0 grid-rows-[32px_126px_minmax(0,1fr)] gap-2 rounded-lg border border-[color:var(--item-stroke)] bg-[var(--item-bg)] p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">選択した日</p>
          <p className="text-sm font-semibold text-slate-500">{formatDayName(now)}</p>
        </div>
        <section className="grid content-center rounded-lg bg-blue-100 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">今日</p>
          <p className="mt-2 text-[32px] font-bold leading-none text-slate-950">{formatShortDate(now)}</p>
          <p className="mt-2 truncate text-sm font-semibold text-slate-600">{nextEvent ? `次は ${formatEventTime(nextEvent)}` : "今後の予定はありません"}</p>
        </section>
        <div className="grid min-h-0 content-start gap-2 overflow-hidden">
          {selectedDayEvents.slice(0, 5).map((event) => (
            <section key={event.id} className="rounded-lg bg-white px-3 py-2">
              <time className="text-sm font-bold text-blue-700">{formatEventTime(event)}</time>
              <p className="mt-1 truncate text-base font-semibold text-slate-800">{event.title}</p>
            </section>
          ))}
        </div>
      </aside>
    </div>
  );
}

function Metric({ label, note, value }: { label: string; note: string; value: string }) {
  return (
    <div className="grid min-w-0 content-center rounded-lg bg-white p-3">
      <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{label}</span>
      <strong className="mt-2 truncate text-[28px] font-bold leading-none text-slate-950">{value}</strong>
      <p className="mt-2 truncate text-sm font-semibold text-slate-500">{note}</p>
    </div>
  );
}

function WeekDayColumn({ date, events, today }: { date: Date; events: CalendarEvent[]; today: boolean }) {
  return (
    <article className="grid min-h-0 grid-rows-[56px_minmax(0,1fr)] overflow-hidden rounded-lg border border-[color:var(--item-stroke)] bg-[var(--item-bg)]">
      <header className={today ? "grid content-center border-b border-[color:var(--item-stroke)] bg-blue-100 px-3" : "grid content-center border-b border-[color:var(--item-stroke)] bg-white px-3"}>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">{formatDayName(date)}</p>
        <p className="mt-0.5 text-xl font-bold text-slate-950">{formatDayNumber(date)}</p>
      </header>
      <div className="grid min-h-0 content-start gap-2 overflow-hidden p-2">
        {events.slice(0, 3).map((event) => (
          <EventChip key={event.id} event={event} />
        ))}
        {events.length > 3 ? <p className="rounded-full bg-slate-100 px-2 py-1 text-center text-xs font-bold text-slate-500">{`他${events.length - 3}件`}</p> : null}
      </div>
    </article>
  );
}

function EventChip({ event }: { event: CalendarEvent }) {
  const tone = event.calendarName === "Family" ? "border-amber-500" : event.calendarName === "Home" ? "border-green-600" : "border-blue-600";

  return (
    <section className={`min-w-0 rounded-lg border-l-4 ${tone} bg-white px-2 py-2`}>
      <time className="text-xs font-bold text-blue-700">{formatEventTime(event)}</time>
      <p className="mt-1 truncate text-sm font-semibold text-slate-800">{event.title}</p>
    </section>
  );
}

function MonthDayCell({ date, events, muted, today }: { date: Date; events: CalendarEvent[]; muted: boolean; today: boolean }) {
  return (
    <section className={`${today ? "outline-2 outline-blue-200 outline" : ""} ${muted ? "opacity-40" : ""} min-w-0 overflow-hidden rounded-lg bg-white p-1.5`}>
      <p className="text-sm font-bold text-slate-700">{formatDayNumber(date)}</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {events.slice(0, 4).map((event) => (
          <span key={event.id} className={event.calendarName === "Family" ? "h-2 w-2 rounded-full bg-amber-500" : event.calendarName === "Home" ? "h-2 w-2 rounded-full bg-green-600" : "h-2 w-2 rounded-full bg-blue-600"} />
        ))}
      </div>
      {events.length > 0 ? <p className="mt-1 truncate text-[11px] font-semibold text-slate-500">{events.length}件</p> : null}
    </section>
  );
}
