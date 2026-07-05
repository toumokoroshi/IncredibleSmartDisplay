import { ChartSpline } from "lucide-react";

import { WidgetFrame } from "../../components/WidgetFrame";
import type { WidgetProps } from "../../types/widget";
import type { StocksData, StocksSettings } from "./types";

export function StocksWidget({ config, data, error, isEmpty, isHighlighted, status }: WidgetProps<StocksSettings, StocksData>) {
  return (
    <WidgetFrame
      cardClassName={isHighlighted ? "ring-2 ring-cyan-400/60" : ""}
      error={error}
      hasData={data !== undefined}
      headerRowClassName="flex items-start justify-between gap-3"
      icon={<ChartSpline size={20} strokeWidth={1.8} />}
      isEmpty={isEmpty}
      status={status}
      title={config.title}
      titleClassName="text-sm uppercase tracking-[0.2em] text-slate-400"
    >
      {data ? (
        <ul className={`${isHighlighted ? "widget-detail-root widget-detail-list stocks-detail-root stocks-detail-list " : ""}mt-4 space-y-3`}>
          {data.items.slice(0, 5).map((item) => (
            <li key={item.symbol} className="widget-list-item flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
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
    </WidgetFrame>
  );
}
