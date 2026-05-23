import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { MaterialSymbolIcon } from "../../components/MaterialSymbolIcon";
import { StaleBadge } from "../../components/StaleBadge";
import { formatScheduleLabel } from "../../utils/date";
import type { WidgetProps } from "../../types/widget";
import type { CalendarData, CalendarSettings } from "./types";

export function CalendarWidget({ config, data, error, isEmpty, isHighlighted, status }: WidgetProps<CalendarSettings, CalendarData>) {
  return (
    <Card className={isHighlighted ? "ring-2 ring-cyan-400/60" : ""}>
      <div className="flex items-start justify-between gap-3">
        <div className="widget-heading flex items-center gap-3">
          <span className="widget-heading-icon">
            <MaterialSymbolIcon name="calendar_month" />
          </span>
          <p className="text-lg uppercase tracking-[0.2em] text-slate-400">{config.title}</p>
        </div>
        {status === "stale" ? <StaleBadge /> : null}
      </div>
      {status === "loading" ? <LoadingState /> : null}
      {status === "error" ? <ErrorState error={error} /> : null}
      {isEmpty ? <EmptyState /> : null}
      {data && status !== "error" && status !== "loading" && !isEmpty ? (
        <ul className={`${isHighlighted ? "widget-detail-root widget-detail-list calendar-detail-root calendar-detail-events " : ""}mt-4 space-y-3`}>
          {data.items.slice(0, 4).map((item) => (
            <li key={item.id} className="widget-list-item rounded-lg border border-white/10 bg-white/5 px-4 py-3">
              <p className="line-clamp-2 text-[25px] font-semibold leading-tight text-white">{item.title}</p>
              <p className="mt-1 text-base text-slate-400">{formatScheduleLabel(item.startsAt)}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
