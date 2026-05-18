import type { WeatherDailySummary, WeatherHourlyPoint, WeatherSunEventPoint, WeatherTimelinePoint } from "./types";

export function buildWeatherTimeline(hourly: WeatherHourlyPoint[], daily: WeatherDailySummary[]): WeatherTimelinePoint[] {
  const sunEvents = daily.flatMap((day) => {
    const events: WeatherSunEventPoint[] = [];
    if (day.sunrise) {
      events.push({ event: "sunrise", time: day.sunrise });
    }
    if (day.sunset) {
      events.push({ event: "sunset", time: day.sunset });
    }
    return events;
  });

  return [
    ...hourly.map((point): WeatherTimelinePoint => ({ kind: "hourly", point })),
    ...sunEvents.map((event): WeatherTimelinePoint => ({ event, kind: "sunEvent", reference: findNearestHourlyPoint(hourly, event.time) })),
  ].sort((a, b) => getTimelineTimeValue(a) - getTimelineTimeValue(b));
}

export function getTimelineKey(point: WeatherTimelinePoint) {
  return point.kind === "hourly" ? `hourly-${point.point.time}` : `${point.event.event}-${point.event.time}`;
}

export function getTimelineTimeValue(point: WeatherTimelinePoint) {
  return new Date(point.kind === "hourly" ? point.point.time : point.event.time).getTime();
}

export function getCurrentHourlyIndex(points: WeatherTimelinePoint[]) {
  const now = Date.now();
  const nextIndex = points.findIndex((point) => getTimelineTimeValue(point) >= now);

  if (nextIndex >= 0) {
    return nextIndex;
  }

  return Math.max(points.length - 1, 0);
}

export function getDayMarkerIndexes(points: WeatherTimelinePoint[]) {
  const markers = new Set<number>();
  let previousDate = "";

  points.forEach((point, index) => {
    const date = (point.kind === "hourly" ? point.point.time : point.event.time).slice(0, 10);
    if (index > 0 && date !== previousDate) {
      markers.add(index);
    }
    previousDate = date;
  });

  return markers;
}

function findNearestHourlyPoint(hourly: WeatherHourlyPoint[], time: string) {
  const target = new Date(time).getTime();
  if (Number.isNaN(target)) {
    return undefined;
  }

  return hourly.reduce<WeatherHourlyPoint | undefined>((nearest, point) => {
    if (nearest === undefined) {
      return point;
    }

    const currentDistance = Math.abs(new Date(point.time).getTime() - target);
    const nearestDistance = Math.abs(new Date(nearest.time).getTime() - target);
    return currentDistance < nearestDistance ? point : nearest;
  }, undefined);
}
