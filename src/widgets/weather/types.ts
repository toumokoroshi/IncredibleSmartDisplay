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
  highTempC?: number;
  lowTempC?: number;
  conditionLabel: string;
  conditionCode?: number;
  displayCondition?: WeatherDisplayCondition;
  humidityPercent?: number;
  windSpeedKph?: number;
  windDirectionDeg?: number;
  precipitationProbabilityPercent?: number;
  hourlyForecast?: WeatherHourlyPoint[];
  updatedAt: string;
};

export type WeatherHourlyPoint = {
  time: string;
  tempC: number;
  windSpeedKph?: number;
  windDirectionDeg?: number;
  precipitationProbabilityPercent?: number;
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
