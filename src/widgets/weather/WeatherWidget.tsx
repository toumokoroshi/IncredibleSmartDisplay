import { Cloud, CloudRain, CloudSun, Sun, Wind } from "lucide-react";

import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { StaleBadge } from "../../components/StaleBadge";
import type { WidgetProps } from "../../types/widget";
import type { WeatherData, WeatherHourlyPoint, WeatherSettings } from "./types";

const celsius = "\u2103";

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
        isHighlighted ? (
          <WeatherDetail data={data} />
        ) : (
          <WeatherQuickLook data={data} />
        )
      ) : null}
    </Card>
  );
}

function WeatherQuickLook({ data }: { data: WeatherData }) {
  const iconType = getWeatherIconType(data.conditionCode, data.conditionLabel);

  return (
    <div className="mt-4 flex h-[calc(100%-2.25rem)] flex-col justify-between">
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-xl text-slate-300">{data.locationName}</p>
          <p className="mt-2 text-5xl font-semibold leading-none text-white">{formatTemp(data.currentTempC)}</p>
          <p className="mt-3 text-lg text-slate-300">{data.conditionLabel}</p>
        </div>
        <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 p-5 text-cyan-100">
          <WeatherIcon size={72} strokeWidth={1.5} type={iconType} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-base">
        <Metric label="High / Low" value={`${formatTemp(data.highTempC)} / ${formatTemp(data.lowTempC)}`} />
        <Metric label="Rain" value={formatPercent(data.precipitationProbabilityPercent)} />
        <Metric label="Wind" value={formatWind(data.windSpeedKph, data.windDirectionDeg)} />
      </div>
    </div>
  );
}

function WeatherDetail({ data }: { data: WeatherData }) {
  const iconType = getWeatherIconType(data.conditionCode, data.conditionLabel);
  const hourly = data.hourlyForecast ?? [];

  return (
    <div className="mt-4 grid h-[calc(100%-2.25rem)] grid-cols-[0.9fr_1.4fr] gap-5">
      <div className="flex min-h-0 flex-col justify-between rounded-lg border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-2xl text-slate-300">{data.locationName}</p>
            <p className="mt-3 text-7xl font-semibold leading-none text-white">{formatTemp(data.currentTempC)}</p>
            <p className="mt-4 text-2xl text-slate-200">{data.conditionLabel}</p>
          </div>
          <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 p-5 text-cyan-100">
            <WeatherIcon size={92} strokeWidth={1.4} type={iconType} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Metric label="High / Low" value={`${formatTemp(data.highTempC)} / ${formatTemp(data.lowTempC)}`} />
          <Metric label="Humidity" value={formatPercent(data.humidityPercent)} />
          <Metric label="Rain" value={formatPercent(data.precipitationProbabilityPercent)} />
          <Metric label="Wind" value={formatWind(data.windSpeedKph, data.windDirectionDeg)} />
        </div>
      </div>

      <div className="grid min-h-0 grid-rows-[1.1fr_0.9fr] gap-4">
        <TemperatureChart hourly={hourly} />
        <WindPanel hourly={hourly} />
      </div>
    </div>
  );
}

function TemperatureChart({ hourly }: { hourly: WeatherHourlyPoint[] }) {
  const points = hourly.slice(0, 8);
  const temps = points.map((point) => point.tempC);
  const min = temps.length > 0 ? Math.min(...temps) : 0;
  const max = temps.length > 0 ? Math.max(...temps) : 0;
  const range = Math.max(max - min, 1);
  const svgPoints = points
    .map((point, index) => {
      const x = points.length === 1 ? 50 : (index / (points.length - 1)) * 100;
      const y = 82 - ((point.tempC - min) / range) * 58;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="min-h-0 rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Today Temperature</p>
        <p className="text-sm text-slate-400">
          {formatTemp(min)} - {formatTemp(max)}
        </p>
      </div>
      {points.length > 0 ? (
        <div className="mt-3">
          <svg className="h-32 w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100" aria-label="Hourly temperature chart">
            <defs>
              <linearGradient id="temperatureLine" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#67e8f9" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
            </defs>
            <polyline fill="none" points={svgPoints} stroke="url(#temperatureLine)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="grid grid-cols-8 gap-2 text-center text-sm text-slate-400">
            {points.map((point) => (
              <div key={point.time}>
                <p className="text-slate-200">{formatTemp(point.tempC)}</p>
                <p>{formatHour(point.time)}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-8 text-slate-400">No hourly forecast available.</p>
      )}
    </div>
  );
}

function WindPanel({ hourly }: { hourly: WeatherHourlyPoint[] }) {
  const points = hourly.slice(0, 8);
  const maxWind = Math.max(...points.map((point) => point.windSpeedKph ?? 0), 1);

  return (
    <div className="min-h-0 rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Wind Direction</p>
        <Wind className="text-cyan-200" size={24} />
      </div>
      <div className="mt-4 grid h-[calc(100%-2.25rem)] grid-cols-8 items-end gap-3">
        {points.map((point) => {
          const speed = point.windSpeedKph ?? 0;
          const height = Math.max((speed / maxWind) * 100, 12);

          return (
            <div key={point.time} className="flex h-full flex-col items-center justify-end gap-2">
              <div className="flex flex-1 items-end">
                <div className="w-4 rounded-full bg-cyan-300/70" style={{ height: `${height}%` }} />
              </div>
              <WindArrow degrees={point.windDirectionDeg} />
              <p className="text-xs text-slate-300">{Math.round(speed)}k</p>
              <p className="text-xs text-slate-500">{formatHour(point.time)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WindArrow({ degrees }: { degrees?: number }) {
  return (
    <span
      aria-label={degrees === undefined ? "Unknown wind direction" : `Wind ${Math.round(degrees)} degrees`}
      className="block h-0 w-0 border-x-[6px] border-b-[12px] border-x-transparent border-b-cyan-100"
      style={{ transform: `rotate(${degrees ?? 0}deg)` }}
    />
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold text-slate-100">{value}</p>
    </div>
  );
}

type WeatherIconType = "clear" | "rain" | "cloudy" | "unknown";

function WeatherIcon({ size, strokeWidth, type }: { size: number; strokeWidth: number; type: WeatherIconType }) {
  if (type === "clear") {
    return <Sun size={size} strokeWidth={strokeWidth} />;
  }
  if (type === "rain") {
    return <CloudRain size={size} strokeWidth={strokeWidth} />;
  }
  if (type === "cloudy") {
    return <CloudSun size={size} strokeWidth={strokeWidth} />;
  }
  return <Cloud size={size} strokeWidth={strokeWidth} />;
}

function getWeatherIconType(conditionCode?: number, conditionLabel = ""): WeatherIconType {
  if (conditionCode === 0 || conditionLabel.toLowerCase().includes("clear")) {
    return "clear";
  }
  if (conditionCode !== undefined && conditionCode >= 50) {
    return "rain";
  }
  if (conditionLabel.toLowerCase().includes("rain")) {
    return "rain";
  }
  if (conditionLabel.toLowerCase().includes("cloud")) {
    return "cloudy";
  }
  return "unknown";
}

function formatTemp(value?: number) {
  return value === undefined ? `--${celsius}` : `${Math.round(value)}${celsius}`;
}

function formatPercent(value?: number) {
  return value === undefined ? "--%" : `${Math.round(value)}%`;
}

function formatWind(speed?: number, direction?: number) {
  const directionLabel = direction === undefined ? "" : ` ${toCompass(direction)}`;
  return speed === undefined ? "--" : `${Math.round(speed)} km/h${directionLabel}`;
}

function toCompass(degrees: number) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(degrees / 45) % directions.length];
}

function formatHour(time: string) {
  const date = new Date(time);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }
  return new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", hour12: false }).format(date);
}
