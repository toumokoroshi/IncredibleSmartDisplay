import type { WeatherData } from "../../widgets/weather";

export const mockWeatherData: WeatherData = {
  locationName: "Tokyo",
  currentTempC: 23,
  highTempC: 27,
  lowTempC: 19,
  conditionLabel: "晴れ時々くもり",
  conditionCode: 2,
  displayCondition: {
    kind: "partlyCloudy",
    label: "晴れ時々くもり",
    transition: "stable",
    modifiers: [],
    isDaytime: true,
  },
  humidityPercent: 68,
  windSpeedKph: 9,
  windDirectionDeg: 210,
  precipitationProbabilityPercent: 20,
  hourlyForecast: [
    { time: "2026-05-12T06:00:00+09:00", tempC: 19, windSpeedKph: 7, windDirectionDeg: 190, precipitationProbabilityPercent: 10 },
    { time: "2026-05-12T09:00:00+09:00", tempC: 22, windSpeedKph: 9, windDirectionDeg: 205, precipitationProbabilityPercent: 15 },
    { time: "2026-05-12T12:00:00+09:00", tempC: 26, windSpeedKph: 12, windDirectionDeg: 220, precipitationProbabilityPercent: 20 },
    { time: "2026-05-12T15:00:00+09:00", tempC: 27, windSpeedKph: 14, windDirectionDeg: 230, precipitationProbabilityPercent: 25 },
    { time: "2026-05-12T18:00:00+09:00", tempC: 24, windSpeedKph: 10, windDirectionDeg: 215, precipitationProbabilityPercent: 20 },
    { time: "2026-05-12T21:00:00+09:00", tempC: 21, windSpeedKph: 8, windDirectionDeg: 200, precipitationProbabilityPercent: 15 },
  ],
  updatedAt: new Date().toISOString(),
};
