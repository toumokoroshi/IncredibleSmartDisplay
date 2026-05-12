export type WeatherSettings = {
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
