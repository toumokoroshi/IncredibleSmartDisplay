export type WeatherSettings = {
  // Keep providers explicit because APIs that require secrets, such as Google Weather,
  // should be routed through a server boundary instead of being called directly from GitHub Pages.
  provider: "openMeteo" | "mock";
  latitude: number;
  longitude: number;
  locationName: string;
  units: "metric";
  showTomorrow: boolean;
  showHumidity: boolean;
  showWind: boolean;
};

export type WeatherData = {
  locationName: string;
  currentTempC: number;
  apparentTempC?: number;
  highTempC?: number;
  lowTempC?: number;
  conditionLabel: string;
  conditionCode?: number;
  displayCondition?: WeatherDisplayCondition;
  todayCondition?: WeatherDisplayCondition;
  humidityPercent?: number;
  windSpeedKph?: number;
  windDirectionDeg?: number;
  precipitationProbabilityPercent?: number;
  todayPrecipitationProbabilityPercent?: number;
  todayMaxWindSpeedKph?: number;
  dailyForecast?: WeatherDailySummary[];
  hourlyForecast?: WeatherHourlyPoint[];
  updatedAt: string;
};

export type WeatherDailySummary = {
  label: string;
  date?: string;
  condition?: WeatherDisplayCondition;
  highTempC?: number;
  lowTempC?: number;
  apparentHighTempC?: number;
  apparentLowTempC?: number;
  precipitationProbabilityPercent?: number;
  maxWindSpeedKph?: number;
  humidityPercent?: number;
  windDirectionDeg?: number;
  uvIndexMax?: number;
  sunrise?: string;
  sunset?: string;
};

export type WeatherHourlyPoint = {
  time: string;
  tempC: number;
  apparentTempC?: number;
  condition?: WeatherDisplayCondition;
  windSpeedKph?: number;
  windDirectionDeg?: number;
  humidityPercent?: number;
  precipitationProbabilityPercent?: number;
  precipitationMm?: number;
};

export type WeatherSunEventPoint = {
  time: string;
  event: "sunrise" | "sunset";
};

export type WeatherTimelinePoint =
  | { kind: "hourly"; point: WeatherHourlyPoint }
  | { event: WeatherSunEventPoint; kind: "sunEvent"; reference?: WeatherHourlyPoint };

export type WeatherInsight = {
  badge: string;
  label: string;
};

export type WeatherConditionKind =
  | "clear"
  | "mostlyClear"
  | "partlyCloudy"
  | "overcast"
  | "fog"
  | "drizzle"
  | "rain"
  | "heavyRain"
  | "snow"
  | "heavySnow"
  | "sleet"
  | "thunderstorm"
  | "unknown";

export type WeatherTransition = "stable" | "then" | "occasional" | "temporary";

export type WeatherModifier = "rainChance" | "thunder" | "strongWind";

export type WeatherDisplayCondition = {
  kind: WeatherConditionKind;
  label: string;
  transition: WeatherTransition;
  secondaryKind?: WeatherConditionKind;
  modifiers: WeatherModifier[];
  isDaytime: boolean;
};
