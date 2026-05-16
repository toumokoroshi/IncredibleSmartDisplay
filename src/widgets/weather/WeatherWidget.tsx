import { CloudSun, Wind } from "lucide-react";

import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { StaleBadge } from "../../components/StaleBadge";
import type { WidgetProps } from "../../types/widget";
import type { WeatherConditionKind, WeatherData, WeatherDisplayCondition, WeatherHourlyPoint, WeatherModifier, WeatherSettings, WeatherTransition } from "./types";

const celsius = "\u2103";
const meteoconsBaseUrl = "https://unpkg.com/@meteocons/svg@0.1.0/flat";

export function WeatherWidget({ config, data, error, isEmpty, isHighlighted, status }: WidgetProps<WeatherSettings, WeatherData>) {
  return (
    <Card className={isHighlighted ? "ring-2 ring-cyan-400/60" : ""}>
      <div className="flex items-start justify-between gap-3">
        <div className="widget-heading flex items-center gap-3">
          <span className="widget-heading-icon">
            <CloudSun size={20} strokeWidth={1.8} />
          </span>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{config.title}</p>
        </div>
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
  const condition = getDisplayCondition(data);

  return (
    <div className="mt-4 flex h-[calc(100%-2.25rem)] flex-col justify-between">
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-xl text-slate-300">{data.locationName}</p>
          <p className="mt-2 text-5xl font-semibold leading-none text-white">{formatTemp(data.currentTempC)}</p>
          <p className="mt-3 text-lg text-slate-300">{formatConditionLabel(condition)}</p>
          <WeatherModifierBadges modifiers={condition.modifiers} />
        </div>
        <div className="weather-hero-icon p-1">
          <WeatherConditionIcon condition={condition} size={82} />
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
  const condition = getDisplayCondition(data);
  const hourly = data.hourlyForecast ?? [];

  return (
    <div className="mt-4 grid h-[calc(100%-2.25rem)] grid-cols-[0.9fr_1.4fr] gap-5">
      <div className="flex min-h-0 flex-col justify-between rounded-lg border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-2xl text-slate-300">{data.locationName}</p>
            <p className="mt-3 text-7xl font-semibold leading-none text-white">{formatTemp(data.currentTempC)}</p>
            <p className="mt-4 text-2xl text-slate-200">{formatConditionLabel(condition)}</p>
            <WeatherModifierBadges modifiers={condition.modifiers} />
          </div>
          <div className="weather-hero-icon p-1">
            <WeatherConditionIcon condition={condition} size={102} />
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
    <div className="weather-metric rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function WeatherConditionIcon({ condition, size }: { condition: WeatherDisplayCondition; size: number }) {
  const primaryIconName = getMeteoconsIconName(condition.kind, condition.isDaytime);
  const secondaryKind = condition.secondaryKind;
  const secondaryIconName = secondaryKind ? getMeteoconsIconName(secondaryKind, condition.isDaytime) : undefined;

  if (condition.transition === "stable" || secondaryKind === undefined || !secondaryIconName) {
    return <WeatherIconImage iconName={primaryIconName} label={condition.label} size={size} />;
  }

  if (condition.transition === "then") {
    return (
      <div className="flex items-center gap-1" aria-label={formatConditionLabel(condition)}>
        <WeatherIconImage iconName={primaryIconName} label={condition.label} size={Math.round(size * 0.7)} />
        <span className="text-xl font-semibold text-slate-500">-&gt;</span>
        <WeatherIconImage iconName={secondaryIconName} label={getKindLabel(secondaryKind)} size={Math.round(size * 0.7)} />
      </div>
    );
  }

  return (
    <div className="relative" aria-label={formatConditionLabel(condition)}>
      <WeatherIconImage iconName={primaryIconName} label={condition.label} size={size} />
      <div className="absolute -bottom-1 -right-2 rounded-full bg-white/90 p-1 shadow-sm">
        <WeatherIconImage iconName={secondaryIconName} label={getKindLabel(secondaryKind)} size={Math.round(size * 0.44)} />
      </div>
    </div>
  );
}

function WeatherIconImage({ iconName, label, size }: { iconName: string; label: string; size: number }) {
  return <img alt={label} height={size} src={`${meteoconsBaseUrl}/${iconName}.svg`} style={{ height: size, width: size }} width={size} />;
}

function WeatherModifierBadges({ modifiers }: { modifiers: WeatherModifier[] }) {
  if (modifiers.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {modifiers.map((modifier) => (
        <span key={modifier} className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
          {getModifierLabel(modifier)}
        </span>
      ))}
    </div>
  );
}

function getDisplayCondition(data: WeatherData): WeatherDisplayCondition {
  return (
    data.displayCondition ?? {
      kind: mapLegacyConditionKind(data.conditionCode, data.conditionLabel),
      label: data.conditionLabel,
      transition: "stable",
      modifiers: [],
      isDaytime: true,
    }
  );
}

function mapLegacyConditionKind(conditionCode?: number, conditionLabel = ""): WeatherConditionKind {
  const normalizedLabel = conditionLabel.toLowerCase();

  switch (conditionCode) {
    case 0:
      return "clear";
    case 1:
      return "mostlyClear";
    case 2:
      return "partlyCloudy";
    case 3:
      return "overcast";
    case 45:
    case 48:
      return "fog";
    case 51:
    case 53:
    case 55:
      return "drizzle";
    case 56:
    case 57:
    case 66:
    case 67:
      return "sleet";
    case 61:
    case 63:
    case 80:
    case 81:
      return "rain";
    case 65:
    case 82:
      return "heavyRain";
    case 71:
    case 73:
    case 85:
      return "snow";
    case 75:
    case 77:
    case 86:
      return "heavySnow";
    case 95:
    case 96:
    case 99:
      return "thunderstorm";
  }

  if (normalizedLabel.includes("clear")) {
    return "clear";
  }
  if (normalizedLabel.includes("cloud")) {
    return "partlyCloudy";
  }
  if (normalizedLabel.includes("rain")) {
    return "rain";
  }
  return "unknown";
}

function getMeteoconsIconName(kind: WeatherConditionKind, isDaytime: boolean) {
  const dayPart = isDaytime ? "day" : "night";

  switch (kind) {
    case "clear":
      return `clear-${dayPart}`;
    case "mostlyClear":
      return `mostly-clear-${dayPart}`;
    case "partlyCloudy":
      return `partly-cloudy-${dayPart}`;
    case "overcast":
      return `overcast-${dayPart}`;
    case "fog":
      return `fog-${dayPart}`;
    case "drizzle":
      return "drizzle";
    case "rain":
      return "rain";
    case "heavyRain":
      return "extreme-rain";
    case "snow":
      return "snow";
    case "heavySnow":
      return "extreme-snow";
    case "sleet":
      return "sleet";
    case "thunderstorm":
      return `thunderstorms-${dayPart}-rain`;
    case "unknown":
      return "not-available";
  }
}

function formatConditionLabel(condition: WeatherDisplayCondition) {
  if (condition.transition === "stable" || condition.secondaryKind === undefined) {
    return condition.label;
  }

  return `${condition.label} ${getTransitionLabel(condition.transition)} ${getKindLabel(condition.secondaryKind)}`;
}

function getTransitionLabel(transition: WeatherTransition) {
  switch (transition) {
    case "stable":
      return "";
    case "then":
      return "のち";
    case "occasional":
      return "時々";
    case "temporary":
      return "一時";
  }
}

function getKindLabel(kind: WeatherConditionKind) {
  switch (kind) {
    case "clear":
    case "mostlyClear":
      return "晴れ";
    case "partlyCloudy":
      return "晴れ時々くもり";
    case "overcast":
      return "くもり";
    case "fog":
      return "霧";
    case "drizzle":
      return "霧雨";
    case "rain":
      return "雨";
    case "heavyRain":
      return "大雨";
    case "snow":
      return "雪";
    case "heavySnow":
      return "大雪";
    case "sleet":
      return "みぞれ";
    case "thunderstorm":
      return "雷雨";
    case "unknown":
      return "不明";
  }
}

function getModifierLabel(modifier: WeatherModifier) {
  switch (modifier) {
    case "rainChance":
      return "雨の可能性";
    case "thunder":
      return "雷";
    case "strongWind":
      return "強風";
  }
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
