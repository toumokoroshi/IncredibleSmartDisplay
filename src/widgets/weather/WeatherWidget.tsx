import { Droplets, Navigation, Umbrella } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { MaterialSymbolIcon } from "../../components/MaterialSymbolIcon";
import { StaleBadge } from "../../components/StaleBadge";
import type { WidgetProps } from "../../types/widget";
import type { WeatherDailySummary, WeatherData, WeatherDisplayCondition, WeatherHourlyPoint, WeatherInsight, WeatherModifier, WeatherSettings, WeatherSunEventPoint, WeatherTimelinePoint } from "./types";
import { formatConditionLabel, getDisplayCondition, getKindLabel, getMeteoconsIconName, getModifierLabel, unavailableCondition } from "./weatherConditionDisplay";
import { getDailySummaries } from "./weatherDaily";
import { formatHour, formatMeters, formatMetersPerSecond, formatPercent, formatPrecipitation, formatTemp, formatTimelineTime, formatWindDirection, getSunEventLabel } from "./weatherFormatters";
import { getDailyJudgementSummary, getWeatherInsights } from "./weatherInsights";
import { buildWeatherTimeline, getCurrentHourlyIndex, getDayMarkerIndexes, getTimelineKey } from "./weatherTimeline";

const meteoconsBaseUrl = "https://unpkg.com/@meteocons/svg@0.1.0/flat";

export function WeatherWidget({ config, data, error, isEmpty, isHighlighted, status }: WidgetProps<WeatherSettings, WeatherData>) {
  return (
    <Card className={`flex flex-col ${isHighlighted ? "ring-2 ring-cyan-400/60" : ""}`}>
      <div className="shrink-0 flex items-start justify-between gap-3">
        <div className="widget-heading flex items-center gap-3">
          <span className="widget-heading-icon">
            <MaterialSymbolIcon name="partly_cloudy_day" />
          </span>
          <p className="text-lg uppercase tracking-[0.2em] text-slate-400">{config.title}</p>
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
  return (
    <div className="mt-4 grid min-h-0 flex-1 content-between gap-3 overflow-hidden" style={{ gridTemplateRows: "258px 202px 206px" }}>
      <NowWeatherSummary data={data} iconSize={264} tempClassName="text-[3.75rem]" />
      <DailyWeatherSummary judgementHourly={data.hourlyForecast} showSummary summary={getDailySummaries(data)[0]} />
      <NextHoursStrip hourly={data.hourlyForecast ?? []} iconSize={99} />
    </div>
  );
}

function WeatherDetail({ data }: { data: WeatherData }) {
  const hourly = data.hourlyForecast ?? [];
  const daily = getDailySummaries(data).slice(0, 2);
  const insights = getWeatherInsights(daily, hourly);

  return (
    <div className="mt-3 grid min-h-0 flex-1 grid-rows-[9.2rem_7.5rem_minmax(0,1fr)] gap-2 overflow-hidden">
      <div className="grid min-h-0 grid-cols-[1.1fr_0.9fr] gap-2 overflow-hidden">
        <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] px-5 py-2">
          <NowWeatherSummary compact data={data} iconSize={88} showApparent tempClassName="text-[3.5rem]" />
        </div>
        <WeatherAlertPanel insights={insights.slice(0, 4)} />
      </div>

      <div className="grid min-h-0 grid-cols-2 gap-3">
        {daily.map((summary) => (
          <DailyWeatherSummary compact key={summary.label} showApparent summary={summary} />
        ))}
      </div>

      <div className="min-h-0 overflow-hidden">
        <HourlyForecastTable daily={daily} hourly={hourly} />
      </div>
    </div>
  );
}

function NowWeatherSummary({
  data,
  iconClassName = "",
  iconSize,
  compact = false,
  showApparent = false,
  tempClassName,
}: {
  compact?: boolean;
  data: WeatherData;
  iconClassName?: string;
  iconSize: number;
  showApparent?: boolean;
  tempClassName: string;
}) {
  const condition = getDisplayCondition(data);

  return (
    <div className={`${compact ? "flex justify-between" : "grid"} h-full min-h-0 items-center gap-5 overflow-hidden`} style={compact ? undefined : { gridTemplateColumns: `minmax(0, 1fr) ${iconSize}px` }}>
      <div className="min-w-0">
        <p className={`${compact ? "text-xs" : "text-sm"} uppercase tracking-[0.18em] text-slate-500`}>Now</p>
        <p className={`${compact ? "mt-0 text-lg" : "mt-1 text-[1.625rem]"} text-slate-300`}>{data.locationName}</p>
        <div className={`${compact ? "mt-2 flex items-end gap-5" : "mt-1.5"}`}>
          <p className={`font-semibold leading-none text-white ${tempClassName}`}>{formatTemp(data.currentTempC)}</p>
          {!compact ? (
            null
          ) : null}
        </div>
        <p className={`${compact ? "mt-1 text-lg" : "mt-1.5 text-[1.375rem]"} text-slate-300`}>{formatConditionLabel(condition)}</p>
        <div className={`${compact ? "mt-2 flex flex-wrap gap-x-4 gap-y-1" : "mt-2 grid max-w-[21.25rem] grid-cols-[repeat(2,minmax(132px,1fr))] gap-2"}`}>
          {!compact ? <InlineWeatherStat chip icon={<Droplets size={15} />} label="Hum" value={formatPercent(data.humidityPercent)} /> : null}
          {!compact ? <InlineWeatherStat chip icon={<WindDirectionIcon degrees={data.windDirectionDeg} size={15} />} label="Wind" value={formatMetersPerSecond(data.windSpeedKph)} /> : null}
          {compact ? <InlineWeatherStat icon={<Droplets size={15} />} label="Hum" value={formatPercent(data.humidityPercent)} /> : null}
          {compact ? <InlineWeatherStat icon={<WindDirectionIcon degrees={data.windDirectionDeg} size={15} />} label="Wind" value={formatMetersPerSecond(data.windSpeedKph)} /> : null}
          {showApparent ? <InlineWeatherStat icon={<span className="text-sm leading-none">{"\u2197"}</span>} label="Feel" value={formatTemp(data.apparentTempC)} /> : null}
        </div>
        <WeatherModifierBadges modifiers={condition.modifiers} />
      </div>
      <div className={`weather-hero-icon grid shrink-0 place-items-center p-1 ${iconClassName}`}>
        <WeatherConditionIcon condition={condition} size={iconSize} />
      </div>
    </div>
  );
}

function DailyWeatherSummary({
  compact = false,
  judgementHourly = [],
  showApparent = false,
  showSummary = false,
  summary,
}: {
  compact?: boolean;
  judgementHourly?: WeatherHourlyPoint[];
  showApparent?: boolean;
  showSummary?: boolean;
  summary?: WeatherDailySummary;
}) {
  const condition = summary?.condition ?? unavailableCondition;
  const summaryText = showSummary ? getDailyJudgementSummary(summary, judgementHourly) : "";

  return (
    <div className={`${compact ? "px-3 py-2" : "px-4 py-2.5"} weather-metric h-full min-h-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]`}>
      <div className={`grid h-full min-h-0 items-center ${compact ? "grid-cols-[auto_1fr] gap-2" : "grid-cols-[132px_minmax(0,1fr)] gap-3.5"}`}>
        <div className="-ml-2">
          <WeatherConditionIcon condition={condition} size={compact ? 82 : 177} />
        </div>
        <div className="min-w-0">
          <div className={`${compact ? "flex min-w-0 items-baseline gap-3" : "grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3"}`}>
            <div className="min-w-0">
              <p className={`${compact ? "text-xs" : "text-sm"} shrink-0 uppercase tracking-[0.18em] text-slate-500`}>{summary?.label ?? "Today"}</p>
              <p className={`${compact ? "text-base" : "text-[1.375rem]"} truncate font-semibold text-slate-100`}>{formatConditionLabel(condition)}</p>
            </div>
            {!compact ? (
              <p className="whitespace-nowrap text-[1.375rem] font-semibold text-slate-500">
                <span className="text-orange-500">{formatTemp(summary?.highTempC)}</span>
                <span className="mx-1 text-slate-400">/</span>
                <span className="text-sky-500">{formatTemp(summary?.lowTempC)}</span>
              </p>
            ) : null}
          </div>
          {compact ? <p className="mt-1 text-base font-semibold text-slate-500">
            <span className="text-orange-500">{formatTemp(summary?.highTempC)}</span>
            <span className="mx-1 text-slate-400">/</span>
            <span className="text-sky-500">{formatTemp(summary?.lowTempC)}</span>
          </p> : null}
          {summaryText ? <p className={`${compact ? "mt-1 truncate text-sm" : "mt-1 text-base"} font-semibold leading-tight text-slate-500`}>{summaryText}</p> : null}
          <div className={`${compact ? "mt-2 flex flex-wrap gap-1.5" : "mt-2 grid grid-cols-3 gap-2.5"}`}>
            <QuickStatChip compact={compact} icon={<Umbrella size={15} />} label="Rain" value={formatPercent(summary?.precipitationProbabilityPercent)} />
            <QuickStatChip compact={compact} icon={<WindDirectionIcon degrees={summary?.windDirectionDeg} size={15} />} label="Wind" value={formatMetersPerSecond(summary?.maxWindSpeedKph)} />
            <QuickStatChip compact={compact} icon={<Droplets size={15} />} label="Hum" value={formatPercent(summary?.humidityPercent)} />
            {showApparent ? <QuickStatChip compact={compact} icon={<span className="text-sm leading-none">{"\u2197"}</span>} label="Feel" value={`${formatTemp(summary?.apparentHighTempC)} / ${formatTemp(summary?.apparentLowTempC)}`} /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function InlineWeatherStat({ chip = false, icon, label, value }: { chip?: boolean; icon: ReactNode; label: string; value: string }) {
  return (
    <div className={`${chip ? "min-h-12 min-w-0 rounded-lg bg-slate-100 px-3 py-[7px]" : ""} inline-flex items-center gap-1.5 text-base font-semibold text-slate-100`}>
      <span className="grid h-[26px] w-[26px] place-items-center rounded-full bg-slate-100 text-blue-600 shadow-sm">{icon}</span>
      <span className="min-w-0">
        <span className="mr-1 text-xs uppercase leading-none tracking-[0.1em] text-slate-500">{label}</span>
        <span className="whitespace-nowrap text-[17px] leading-none">{value}</span>
      </span>
    </div>
  );
}

function QuickStatChip({ compact = false, icon, label, value }: { compact?: boolean; icon: ReactNode; label: string; value: string }) {
  return (
    <div className={`${compact ? "min-w-[6.2rem] rounded-full px-2.5 py-1.5" : "min-w-0 rounded-lg px-2.5 py-1.5"} bg-slate-100`}>
      <div className="flex items-center gap-2">
        <span className={`${compact ? "h-5 w-5" : "h-6 w-6"} grid place-items-center rounded-full bg-white text-blue-600 shadow-sm`}>{icon}</span>
        <span className="min-w-0">
          <span className={`${compact ? "text-[0.62rem]" : "text-[13px]"} block uppercase tracking-[0.1em] text-slate-500`}>{label}</span>
          <span className={`${compact ? "text-sm" : "text-lg"} block whitespace-nowrap font-semibold leading-tight text-slate-100`}>{value}</span>
        </span>
      </div>
    </div>
  );
}

function NextHoursStrip({ hourly, iconSize = 34 }: { hourly: WeatherHourlyPoint[]; iconSize?: number }) {
  const points = hourly.slice(0, 6);

  if (points.length === 0) {
    return null;
  }

  return (
    <div className="weather-metric h-full min-h-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2">
      <div className="flex items-center justify-between">
        <p className="text-base uppercase tracking-[0.18em] text-slate-500">Next hours</p>
        <p className="text-base font-medium text-slate-500">Rain / Temp</p>
      </div>
      <div className="mt-1.5 grid grid-cols-6 gap-2">
        {points.map((point) => {
          const pointCondition = point.condition ?? unavailableCondition;

          return (
            <div key={point.time} className="grid min-w-0 justify-items-center rounded-md bg-white/50 px-2 py-1 text-center text-[15px] leading-tight">
              <p className="text-xs font-medium text-slate-500">{formatHour(point.time)}</p>
              <div className="flex justify-center">
                <WeatherConditionIcon condition={pointCondition} size={iconSize} />
              </div>
              <p className="mt-0.5 text-[15px] font-semibold text-slate-100">{formatTemp(point.tempC)}</p>
              <p className="text-xs text-sky-600">{formatPercent(point.precipitationProbabilityPercent)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeatherAlertPanel({ insights }: { insights: WeatherInsight[] }) {
  return (
    <div className="min-h-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5">
      <p className="mb-1 text-xs uppercase tracking-[0.18em] text-slate-500">Alerts</p>
      {insights.map((insight) => (
        <InsightLine insight={insight} key={insight.label} />
      ))}
    </div>
  );
}

function InsightLine({ insight }: { insight: WeatherInsight }) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-white/10 py-0.5 first:border-t-0">
      <span className="min-w-0 truncate text-[0.82rem] font-medium text-slate-100">{insight.label}</span>
      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-blue-600">{insight.badge}</span>
    </div>
  );
}

function HourlyForecastTable({ daily, hourly }: { daily: WeatherDailySummary[]; hourly: WeatherHourlyPoint[] }) {
  const points = buildWeatherTimeline(hourly.slice(0, 48), daily);
  const currentIndex = getCurrentHourlyIndex(points);
  const dayMarkers = getDayMarkerIndexes(points);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollArea = scrollRef.current;
    const nowCell = scrollArea?.querySelector<HTMLElement>(".weather-hourly-now");
    if (!scrollArea || !nowCell) {
      return;
    }

    const targetLeft = nowCell.offsetLeft - scrollArea.clientWidth * 0.42 + nowCell.clientWidth / 2;
    scrollArea.scrollLeft = Math.max(0, targetLeft);
  }, [currentIndex, points.length]);

  return (
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)] overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] p-2">
      {points.length > 0 ? (
        <div ref={scrollRef} className="weather-hourly-scroll min-h-0 overflow-x-auto overflow-y-hidden pb-8">
          <div className="grid min-w-max grid-flow-col auto-cols-[4.5rem] items-stretch">
            <div className="sticky left-0 z-10 grid w-[3.5rem] grid-rows-[1.45rem_1.55rem_1.55rem_1.55rem_1.55rem_3.6rem] bg-white/95 text-sm font-semibold text-slate-500">
              <HourlyLabel>{"\u6642\u523b"}</HourlyLabel>
              <HourlyLabel>{"\u5929\u6c17"}</HourlyLabel>
              <HourlyLabel>{"\u6c17\u6e29"}</HourlyLabel>
              <HourlyLabel>{"\u964d\u6c34"}</HourlyLabel>
              <HourlyLabel>{"\u96e8\u91cf"}</HourlyLabel>
              <HourlyLabel>{"\u98a8"}</HourlyLabel>
            </div>
            {points.map((timelinePoint, index) => {
              const isPast = index < currentIndex;
              const isNow = index === currentIndex;
              const isDayMarker = dayMarkers.has(index);

              return <HourlyColumn isDayMarker={isDayMarker} isNow={isNow} isPast={isPast} key={getTimelineKey(timelinePoint)} timelinePoint={timelinePoint} />;
            })}
          </div>
        </div>
      ) : (
        <p className="rounded-lg border border-white/10 px-4 py-6 text-slate-400">No hourly forecast available.</p>
      )}
    </div>
  );
}

function HourlyLabel({ children }: { children: ReactNode }) {
  return <div className="flex items-center">{children}</div>;
}

function HourlyColumn({ isDayMarker, isNow, isPast, timelinePoint }: { isDayMarker: boolean; isNow: boolean; isPast: boolean; timelinePoint: WeatherTimelinePoint }) {
  const isSunEvent = timelinePoint.kind === "sunEvent";
  const point = timelinePoint.kind === "hourly" ? timelinePoint.point : timelinePoint.reference;
  const condition = point?.condition ?? unavailableCondition;

  return (
    <div
      className={[
        "grid grid-rows-[1.45rem_1.55rem_1.55rem_1.55rem_1.55rem_3.6rem] justify-items-center text-center text-[0.82rem] font-normal text-slate-600",
        isPast ? "opacity-40 grayscale" : "",
        isDayMarker ? "bg-slate-950/[0.04]" : "",
      ].join(" ")}
    >
      <div className={`grid w-full place-items-center border-b-2 ${isNow ? "weather-hourly-now border-blue-500 font-semibold text-slate-100" : "border-slate-300"}`}>{isDayMarker ? "\u660e\u65e5" : formatTimelineTime(timelinePoint)}</div>
      <div className="grid place-items-center">
        {isDayMarker ? <span className="text-xs text-slate-500">{"\u660e\u65e5"}</span> : isSunEvent ? <SunEventIcon event={timelinePoint.event.event} size={18} /> : <WeatherConditionIcon condition={condition} size={18} />}
      </div>
      <div className="grid place-items-center">{isDayMarker ? "--" : isSunEvent ? getSunEventLabel(timelinePoint.event.event) : formatTemp(point?.tempC)}</div>
      <div className="grid place-items-center text-sky-600">{formatPercent(point?.precipitationProbabilityPercent)}</div>
      <div className="grid place-items-center text-[0.72rem]">{formatPrecipitation(point?.precipitationMm)}</div>
      <div className="grid place-items-center text-[0.7rem] leading-none">
        <div className="text-sky-500">
          <WindDirectionIcon degrees={point?.windDirectionDeg} size={12} />
        </div>
        <div>{formatWindDirection(point?.windDirectionDeg)}</div>
        <div>{formatMeters(point?.windSpeedKph)}</div>
      </div>
    </div>
  );
}

function SunEventIcon({ event, size }: { event: WeatherSunEventPoint["event"]; size: number }) {
  return <WeatherIconImage iconName={event} label={getSunEventLabel(event)} size={size} />;
}

function WindDirectionIcon({ degrees, size }: { degrees?: number; size: number }) {
  return <Navigation size={size} style={{ transform: `rotate(${degrees ?? 0}deg)` }} />;
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
  return <img alt={label} className="drop-shadow-[0_8px_10px_rgba(15,23,42,0.14)]" height={size} src={`${meteoconsBaseUrl}/${iconName}.svg`} style={{ height: size, width: size }} width={size} />;
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
