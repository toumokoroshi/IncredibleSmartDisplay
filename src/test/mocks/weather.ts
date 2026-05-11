import type { WeatherData } from "../../widgets/weather";

export const mockWeatherData: WeatherData = {
  locationName: "Tokyo",
  currentTempC: 23,
  highTempC: 27,
  lowTempC: 19,
  conditionLabel: "Partly cloudy",
  humidityPercent: 68,
  windSpeedKph: 9,
  updatedAt: new Date().toISOString(),
};
