import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { StaleBadge } from "../../components/StaleBadge";
import { formatScheduleLabel } from "../../utils/date";
import type { WidgetProps } from "../../types/widget";
import type { CalendarData, CalendarSettings } from "./types";

export function CalendarWidget({ config, data, error, isEmpty, isHighlighted, status }: WidgetProps<CalendarSettings, CalendarData>) {
  return (
    <Card className={isHighlighted ? "ring-2 ring-cyan-400/60" : ""}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{config.title}</p>
        {status === "stale" ? <StaleBadge /> : null}
      </div>
      {status === "loading" ? <LoadingState /> : null}
      {status === "error" ? <ErrorState error={error} /> : null}
      {isEmpty ? <EmptyState /> : null}
      {data && status !== "error" && status !== "loading" && !isEmpty ? (
        <ul className="mt-4 space-y-3">
          {data.items.slice(0, 4).map((item) => (
            <li key={item.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="line-clamp-2 text-xl font-semibold text-white">{item.title}</p>
              <p className="mt-1 text-sm text-slate-400">{formatScheduleLabel(item.startsAt)}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
