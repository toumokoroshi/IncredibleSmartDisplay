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
  humidityPercent?: number;
  windSpeedKph?: number;
  updatedAt: string;
};
