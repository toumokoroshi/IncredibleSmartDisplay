import type { WeatherDailySummary, WeatherData } from "./types";
import { getDisplayCondition } from "./weatherConditionDisplay";

export function getDailySummaries(data: WeatherData): WeatherDailySummary[] {
  if (data.dailyForecast && data.dailyForecast.length > 0) {
    return data.dailyForecast;
  }

  return [
    {
      label: "今日",
      condition: data.todayCondition ?? getDisplayCondition(data),
      highTempC: data.highTempC,
      lowTempC: data.lowTempC,
      precipitationProbabilityPercent: data.todayPrecipitationProbabilityPercent ?? data.precipitationProbabilityPercent,
      maxWindSpeedKph: data.todayMaxWindSpeedKph,
      humidityPercent: data.humidityPercent,
      windDirectionDeg: data.windDirectionDeg,
    },
  ];
}
