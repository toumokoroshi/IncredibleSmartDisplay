import { z } from "zod";

import { createWeatherService } from "../../services/weather/weatherService";
import { WeatherWidget } from "./WeatherWidget";

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

export const weatherDefinition = {
  type: "weather",
  component: WeatherWidget,
  settingsSchema: weatherSettingsSchema,
  createService: createWeatherService,
  fallbackArea: "main-left",
  defaultRefreshIntervalSec: 1800,
  cacheTtlHours: 3,
  isEmpty: () => false,
  detailDisplayMode: "weather",
} as const;
