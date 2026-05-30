import { z } from "zod";

import { createWeatherService } from "../../services/weather/weatherService";
import { WeatherWidget } from "./WeatherWidget";
import type { WeatherData } from "./types";

export const weatherSettingsSchema = z.object({
  provider: z.enum(["openMeteo", "mock"]),
  latitude: z.number(),
  longitude: z.number(),
  locationName: z.string(),
  units: z.literal("metric"),
  showTomorrow: z.boolean(),
  showHumidity: z.boolean(),
  showWind: z.boolean(),
});

const weatherDisplayConditionSchema = z.object({
  kind: z.enum(["clear", "mostlyClear", "partlyCloudy", "overcast", "fog", "drizzle", "rain", "heavyRain", "snow", "heavySnow", "sleet", "thunderstorm", "unknown"]),
  label: z.string(),
  transition: z.enum(["stable", "then", "occasional", "temporary"]),
  secondaryKind: z.enum(["clear", "mostlyClear", "partlyCloudy", "overcast", "fog", "drizzle", "rain", "heavyRain", "snow", "heavySnow", "sleet", "thunderstorm", "unknown"]).optional(),
  modifiers: z.array(z.enum(["rainChance", "thunder", "strongWind"])),
  isDaytime: z.boolean(),
});

const weatherDailySummarySchema = z.object({
  label: z.string(),
  date: z.string().optional(),
  condition: weatherDisplayConditionSchema.optional(),
  highTempC: z.number().optional(),
  lowTempC: z.number().optional(),
  apparentHighTempC: z.number().optional(),
  apparentLowTempC: z.number().optional(),
  precipitationProbabilityPercent: z.number().optional(),
  maxWindSpeedKph: z.number().optional(),
  humidityPercent: z.number().optional(),
  windDirectionDeg: z.number().optional(),
  uvIndexMax: z.number().optional(),
  sunrise: z.string().optional(),
  sunset: z.string().optional(),
});

const weatherHourlyPointSchema = z.object({
  time: z.string(),
  tempC: z.number(),
  apparentTempC: z.number().optional(),
  condition: weatherDisplayConditionSchema.optional(),
  windSpeedKph: z.number().optional(),
  windDirectionDeg: z.number().optional(),
  humidityPercent: z.number().optional(),
  precipitationProbabilityPercent: z.number().optional(),
  precipitationMm: z.number().optional(),
});

const weatherDataSchema: z.ZodType<WeatherData> = z.object({
  locationName: z.string(),
  currentTempC: z.number(),
  apparentTempC: z.number().optional(),
  highTempC: z.number().optional(),
  lowTempC: z.number().optional(),
  conditionLabel: z.string(),
  conditionCode: z.number().optional(),
  displayCondition: weatherDisplayConditionSchema.optional(),
  todayCondition: weatherDisplayConditionSchema.optional(),
  humidityPercent: z.number().optional(),
  windSpeedKph: z.number().optional(),
  windDirectionDeg: z.number().optional(),
  precipitationProbabilityPercent: z.number().optional(),
  todayPrecipitationProbabilityPercent: z.number().optional(),
  todayMaxWindSpeedKph: z.number().optional(),
  dailyForecast: z.array(weatherDailySummarySchema).optional(),
  hourlyForecast: z.array(weatherHourlyPointSchema).optional(),
  updatedAt: z.string().refine((value) => Number.isNaN(Date.parse(value)) === false),
});

export const weatherDefinition = {
  type: "weather",
  component: WeatherWidget,
  settingsSchema: weatherSettingsSchema,
  createService: createWeatherService,
  fallbackArea: "main-left",
  defaultRefreshIntervalSec: 1800,
  cacheTtlHours: 3,
  validateData: (data: unknown): data is WeatherData => weatherDataSchema.safeParse(data).success,
  isEmpty: () => false,
  detailDisplayMode: "weather",
} as const;
