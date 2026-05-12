import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { StaleBadge } from "../../components/StaleBadge";
import { formatDistanceToNowLabel } from "../../utils/date";
import type { WidgetProps } from "../../types/widget";
import type { NewsData, NewsSettings } from "./types";

export function NewsWidget({ config, data, error, isEmpty, isHighlighted, status }: WidgetProps<NewsSettings, NewsData>) {
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
          {data.items.slice(0, 5).map((item) => (
            <li key={item.id} className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
              <p className="line-clamp-2 text-lg font-semibold text-white">{item.title}</p>
              <p className="mt-2 text-sm text-slate-400">
                {[item.source, item.publishedAt ? formatDistanceToNowLabel(item.publishedAt) : null].filter(Boolean).join(" / ")}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
