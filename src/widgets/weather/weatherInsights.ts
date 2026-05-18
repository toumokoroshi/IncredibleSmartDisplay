import type { WeatherDailySummary, WeatherHourlyPoint, WeatherInsight } from "./types";
import { formatHourNumber, formatMetersPerSecond, formatPercent, formatTemp } from "./weatherFormatters";

const rainProbabilityAlertThreshold = 50;
const hourlyRainAmountAlertThresholdMm = 1;
const hotApparentTempThresholdC = 28;
const veryHotApparentTempThresholdC = 31;
const coldLowTempThresholdC = 10;
const largeTempGapThresholdC = 10;
const strongWindThresholdKph = 28;
const strongUvThreshold = 6;

export function getWeatherInsights(daily: WeatherDailySummary[], hourly: WeatherHourlyPoint[]): WeatherInsight[] {
  const today = daily[0];
  const tomorrow = daily[1];
  const rainyPoint = hourly.find((point) => (point.precipitationProbabilityPercent ?? 0) >= rainProbabilityAlertThreshold);
  const maxApparent = Math.max(...daily.map((day) => day.apparentHighTempC ?? day.highTempC ?? Number.NEGATIVE_INFINITY));
  const maxUv = Math.max(...daily.map((day) => day.uvIndexMax ?? Number.NEGATIVE_INFINITY));
  const insights: WeatherInsight[] = [];

  if (rainyPoint) {
    insights.push({ badge: "Rain", label: `${formatHourNumber(rainyPoint.time)}\u6642\u4ee5\u964d\u306b\u96e8\u306e\u53ef\u80fd\u6027` });
  } else {
    insights.push({ badge: "Good", label: "\u5927\u304d\u306a\u5929\u6c17\u5d29\u308c\u306a\u3057" });
  }

  if (maxApparent >= hotApparentTempThresholdC) {
    insights.push({ badge: "Feel", label: "\u663c\u306f\u6691\u304f\u611f\u3058\u308b" });
  }

  if (maxUv >= strongUvThreshold) {
    insights.push({ badge: `UV ${Math.round(maxUv)}`, label: "UV \u3084\u3084\u5f37\u3081" });
  }

  if (today && tomorrow) {
    insights.push({
      badge: "Temp",
      label: `\u6700\u9ad8\u6c17\u6e29 ${formatTemp(today.highTempC)} \u2192 ${formatTemp(tomorrow.highTempC)}`,
    });
    insights.push({
      badge: "Rain",
      label: `\u964d\u6c34\u78ba\u7387 ${formatPercent(today.precipitationProbabilityPercent)} \u2192 ${formatPercent(tomorrow.precipitationProbabilityPercent)}`,
    });
    insights.push({
      badge: "Wind",
      label: `\u98a8 ${formatMetersPerSecond(today.maxWindSpeedKph)} \u2192 ${formatMetersPerSecond(tomorrow.maxWindSpeedKph)}`,
    });
  }

  return insights;
}

export function getDailyJudgementSummary(summary?: WeatherDailySummary, hourly: WeatherHourlyPoint[] = []) {
  if (summary === undefined) {
    return "";
  }

  const precipitation = summary.precipitationProbabilityPercent ?? 0;
  const maxHourlyRainMm = Math.max(0, ...hourly.map((point) => point.precipitationMm ?? 0));
  const apparentHigh = summary.apparentHighTempC ?? summary.highTempC;
  const low = summary.lowTempC;
  const high = summary.highTempC;
  const windSpeed = summary.maxWindSpeedKph ?? 0;
  const hasThunder = summary.condition?.modifiers.includes("thunder") ?? false;

  if (hasThunder) {
    return "\u96f7\u96e8\u306b\u6ce8\u610f";
  }

  if (precipitation >= rainProbabilityAlertThreshold || maxHourlyRainMm >= hourlyRainAmountAlertThresholdMm) {
    return "\u5098\u304c\u3042\u308b\u3068\u5b89\u5fc3";
  }

  if (windSpeed >= strongWindThresholdKph) {
    return "\u98a8\u304c\u5f37\u3081";
  }

  if (apparentHigh !== undefined && apparentHigh >= veryHotApparentTempThresholdC) {
    return "\u663c\u306f\u6691\u3055\u306b\u6ce8\u610f";
  }

  if (apparentHigh !== undefined && apparentHigh >= hotApparentTempThresholdC) {
    return "\u663c\u306f\u6696\u304b\u304f\u611f\u3058\u308b";
  }

  if (low !== undefined && low <= coldLowTempThresholdC) {
    return "\u671d\u6669\u306f\u51b7\u3048\u308b";
  }

  if (high !== undefined && low !== undefined && high - low >= largeTempGapThresholdC) {
    return "\u5bd2\u6696\u5dee\u306b\u6ce8\u610f";
  }

  if ((summary.uvIndexMax ?? 0) >= strongUvThreshold) {
    return "\u7d2b\u5916\u7dda\u5bfe\u7b56\u3092\u5fd8\u308c\u305a\u306b";
  }

  return "\u96e8\u5177\u306a\u3057\u3067\u3082\u5fc3\u914d\u306a\u3057";
}
