import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { StaleBadge } from "../../components/StaleBadge";
import type { WidgetProps } from "../../types/widget";
import type { WeatherData, WeatherSettings } from "./types";

export function WeatherWidget({ config, data, error, isEmpty, isHighlighted, status }: WidgetProps<WeatherSettings, WeatherData>) {
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
        <div className="mt-4">
          <p className="text-xl text-slate-300">{data.locationName}</p>
          <p className="mt-2 text-5xl font-semibold text-white">{data.currentTempC} deg</p>
          <p className="mt-2 text-lg text-slate-300">{data.conditionLabel}</p>
          <p className="mt-4 text-base text-slate-400">
            H {data.highTempC ?? "--"} deg / L {data.lowTempC ?? "--"} deg
          </p>
        </div>
      ) : null}
    </Card>
  );
}
