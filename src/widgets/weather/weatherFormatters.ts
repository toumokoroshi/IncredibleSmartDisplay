import type { WeatherSunEventPoint, WeatherTimelinePoint } from "./types";

const celsius = "\u2103";

export function formatTemp(value?: number) {
  return value === undefined ? `--${celsius}` : `${Math.round(value)}${celsius}`;
}

export function formatPercent(value?: number) {
  return value === undefined ? "--%" : `${Math.round(value)}%`;
}

export function formatMetersPerSecond(speedKph?: number) {
  return speedKph === undefined ? "--" : `${Math.round(speedKph / 3.6)} m/s`;
}

export function formatMeters(speedKph?: number) {
  return speedKph === undefined ? "--" : `${Math.round(speedKph / 3.6)}m`;
}

export function formatPrecipitation(value?: number) {
  if (value === undefined) {
    return "--";
  }

  return `${Number.isInteger(value) ? value : value.toFixed(1)} mm`;
}

export function formatWindDirection(degrees?: number) {
  if (degrees === undefined) {
    return "--";
  }

  const directions = ["\u5317", "\u5317\u6771", "\u6771", "\u5357\u6771", "\u5357", "\u5357\u897f", "\u897f", "\u5317\u897f"];
  return directions[Math.round(degrees / 45) % directions.length];
}

export function getSunEventLabel(event: WeatherSunEventPoint["event"]) {
  return event === "sunrise" ? "\u65e5\u306e\u51fa" : "\u65e5\u306e\u5165";
}

export function formatTimelineTime(point: WeatherTimelinePoint) {
  return point.kind === "hourly" ? formatHourNumber(point.point.time) : formatMinuteTime(point.event.time);
}

export function formatHour(time: string) {
  const date = new Date(time);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }
  return new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", hour12: false }).format(date);
}

export function formatHourNumber(time: string) {
  const date = new Date(time);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }
  return new Intl.DateTimeFormat("ja-JP", { hour: "numeric", hour12: false }).format(date);
}

export function formatMinuteTime(time: string) {
  const date = new Date(time);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }
  return new Intl.DateTimeFormat("ja-JP", { hour: "numeric", minute: "2-digit", hour12: false }).format(date);
}
