import type { WeatherData, WeatherDisplayCondition } from "../../widgets/weather";

const partlyCloudyDay: WeatherDisplayCondition = {
  kind: "partlyCloudy",
  label: "晴れ時々くもり",
  transition: "stable",
  modifiers: [],
  isDaytime: true,
};

const overcastDay: WeatherDisplayCondition = {
  kind: "overcast",
  label: "くもり",
  transition: "stable",
  modifiers: [],
  isDaytime: true,
};

const clearDay: WeatherDisplayCondition = {
  kind: "clear",
  label: "晴れ",
  transition: "stable",
  modifiers: [],
  isDaytime: true,
};

const rainNight: WeatherDisplayCondition = {
  kind: "rain",
  label: "雨",
  transition: "stable",
  modifiers: [],
  isDaytime: false,
};

const clearNight: WeatherDisplayCondition = {
  kind: "clear",
  label: "晴れ",
  transition: "stable",
  modifiers: [],
  isDaytime: false,
};

const hourlyTemps = [19, 20, 21, 22, 24, 25, 26, 27, 27, 26, 24, 22, 21, 20, 19, 19, 18, 18, 17, 17, 16, 16, 16, 15];
const hourlyApparentTemps = [19, 21, 22, 23, 26, 27, 29, 30, 30, 29, 26, 23, 22, 21, 19, 19, 18, 18, 17, 17, 16, 16, 16, 15];
const hourlyRain = [10, 10, 15, 15, 20, 20, 25, 25, 25, 30, 35, 35, 30, 25, 20, 20, 20, 15, 10, 10, 5, 5, 5, 5];
const hourlyPrecipitationMm = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0.1, 0.2, 0.5, 0.8, 0.5, 0.1, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const hourlyHumidity = [68, 67, 66, 65, 63, 61, 60, 59, 60, 62, 65, 68, 70, 72, 74, 76, 78, 80, 81, 82, 82, 81, 80, 78];
const hourlyWindKph = [7, 8, 9, 9, 10, 11, 12, 14, 14, 13, 12, 10, 10, 9, 8, 8, 7, 7, 6, 6, 5, 5, 5, 4];
const hourlyWindDeg = [190, 195, 205, 205, 210, 215, 220, 230, 230, 225, 215, 210, 205, 200, 200, 195, 190, 190, 185, 185, 180, 180, 175, 175];

export const mockWeatherData: WeatherData = {
  locationName: "Tokyo",
  currentTempC: 23,
  apparentTempC: 25,
  highTempC: 27,
  lowTempC: 19,
  conditionLabel: "晴れ時々くもり",
  conditionCode: 2,
  displayCondition: partlyCloudyDay,
  todayCondition: overcastDay,
  humidityPercent: 68,
  windSpeedKph: 9,
  windDirectionDeg: 210,
  precipitationProbabilityPercent: 20,
  todayPrecipitationProbabilityPercent: 35,
  todayMaxWindSpeedKph: 14,
  dailyForecast: [
    {
      label: "今日",
      date: "2026-05-12",
      condition: overcastDay,
      highTempC: 27,
      lowTempC: 19,
      apparentHighTempC: 30,
      apparentLowTempC: 19,
      precipitationProbabilityPercent: 35,
      maxWindSpeedKph: 14,
      humidityPercent: 68,
      windDirectionDeg: 210,
      uvIndexMax: 6,
      sunrise: "2026-05-12T04:37:00+09:00",
      sunset: "2026-05-12T18:42:00+09:00",
    },
    {
      label: "明日",
      date: "2026-05-13",
      condition: clearDay,
      highTempC: 28,
      lowTempC: 18,
      apparentHighTempC: 30,
      apparentLowTempC: 18,
      precipitationProbabilityPercent: 10,
      maxWindSpeedKph: 9,
      humidityPercent: 62,
      windDirectionDeg: 180,
      uvIndexMax: 6,
      sunrise: "2026-05-13T04:36:00+09:00",
      sunset: "2026-05-13T18:43:00+09:00",
    },
  ],
  hourlyForecast: Array.from({ length: 48 }, (_, index) => {
    const hour = index % 24;
    const date = index < 24 ? "2026-05-12" : "2026-05-13";
    const sampleIndex = index % hourlyTemps.length;
    const tempC = hourlyTemps[sampleIndex] ?? 23;
    const time = `${date}T${String(hour).padStart(2, "0")}:00:00+09:00`;
    const isDaytime = hour % 24 >= 6 && hour % 24 < 18;
    const condition = index < 8 ? partlyCloudyDay : index < 16 ? overcastDay : isDaytime ? overcastDay : index < 20 ? rainNight : clearNight;

    return {
      time,
      tempC,
      apparentTempC: hourlyApparentTemps[sampleIndex],
      condition,
      humidityPercent: hourlyHumidity[sampleIndex],
      windSpeedKph: hourlyWindKph[sampleIndex],
      windDirectionDeg: hourlyWindDeg[sampleIndex],
      precipitationProbabilityPercent: hourlyRain[sampleIndex],
      precipitationMm: hourlyPrecipitationMm[sampleIndex],
    };
  }),
  updatedAt: new Date().toISOString(),
};
