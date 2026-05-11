import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { StaleBadge } from "../../components/StaleBadge";
import type { WidgetProps } from "../../types/widget";
import type { StocksData, StocksSettings } from "./types";

export function StocksWidget({ config, data, error, isEmpty, isHighlighted, status }: WidgetProps<StocksSettings, StocksData>) {
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
            <li key={item.symbol} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div>
                <p className="text-lg font-semibold text-white">{item.name}</p>
                <p className="text-sm text-slate-400">{item.symbol}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-white">{item.price.toFixed(2)}</p>
                <p className={`text-sm ${item.changePercent && item.changePercent >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                  {item.changePercent ? `${item.changePercent > 0 ? "+" : ""}${item.changePercent.toFixed(2)}%` : "--"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
