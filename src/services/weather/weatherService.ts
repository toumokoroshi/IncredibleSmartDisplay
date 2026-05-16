import { mockWeatherData } from "../../test/mocks/weather";
import type { WidgetService } from "../../types/widget";
import { withTimeout } from "../../utils/timeout";
import type { WeatherConditionKind, WeatherData, WeatherDisplayCondition, WeatherModifier, WeatherSettings } from "../../widgets/weather";

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    weather_code?: number;
    is_day?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
  };
  daily?: {
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    wind_speed_10m?: number[];
    wind_direction_10m?: number[];
    precipitation_probability?: number[];
  };
};

export function createWeatherService(): WidgetService<WeatherSettings, WeatherData> {
  return {
    async fetch(settings) {
      if (settings.provider === "mock") {
        return mockWeatherData;
      }

      try {
        const url = new URL("https://api.open-meteo.com/v1/forecast");
        url.searchParams.set("latitude", String(settings.latitude));
        url.searchParams.set("longitude", String(settings.longitude));
        url.searchParams.set("current", "temperature_2m,relative_humidity_2m,weather_code,is_day,wind_speed_10m,wind_direction_10m");
        url.searchParams.set("hourly", "temperature_2m,precipitation_probability,wind_speed_10m,wind_direction_10m");
        url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min");
        url.searchParams.set("forecast_days", "1");
        url.searchParams.set("timezone", "Asia/Tokyo");

        const response = await withTimeout(fetch(url), 10000);
        if (!response.ok) {
          throw new Error("NETWORK_ERROR");
        }

        const payload = (await response.json()) as OpenMeteoResponse;
        const conditionCode = payload.current?.weather_code ?? 2;
        const displayCondition = mapWeatherCodeToDisplayCondition(conditionCode, payload.current?.is_day !== 0);
        return {
          locationName: settings.locationName,
          currentTempC: Math.round(payload.current?.temperature_2m ?? mockWeatherData.currentTempC),
          highTempC: payload.daily?.temperature_2m_max?.[0],
          lowTempC: payload.daily?.temperature_2m_min?.[0],
          conditionLabel: displayCondition.label,
          conditionCode,
          displayCondition,
          windSpeedKph: payload.current?.wind_speed_10m,
          windDirectionDeg: payload.current?.wind_direction_10m,
          humidityPercent: payload.current?.relative_humidity_2m ?? mockWeatherData.humidityPercent,
          precipitationProbabilityPercent: payload.hourly?.precipitation_probability?.[0],
          hourlyForecast: mapHourlyForecast(payload).filter((_, index) => index % 3 === 0),
          updatedAt: new Date().toISOString(),
        };
      } catch {
        return mockWeatherData;
      }
    },
  };
}

export function mapWeatherCodeToDisplayCondition(conditionCode: number, isDaytime: boolean): WeatherDisplayCondition {
  const base = mapWeatherCodeToKind(conditionCode);

  return {
    kind: base.kind,
    label: base.label,
    transition: "stable",
    modifiers: base.modifiers,
    isDaytime,
  };
}

function mapWeatherCodeToKind(conditionCode: number): {
  kind: WeatherConditionKind;
  label: string;
  modifiers: WeatherModifier[];
} {
  switch (conditionCode) {
    case 0:
      return { kind: "clear", label: "晴れ", modifiers: [] };
    case 1:
      return { kind: "mostlyClear", label: "晴れ", modifiers: [] };
    case 2:
      return { kind: "partlyCloudy", label: "晴れ時々くもり", modifiers: [] };
    case 3:
      return { kind: "overcast", label: "くもり", modifiers: [] };
    case 45:
    case 48:
      return { kind: "fog", label: "霧", modifiers: [] };
    case 51:
    case 53:
    case 55:
      return { kind: "drizzle", label: "霧雨", modifiers: [] };
    case 56:
    case 57:
    case 66:
    case 67:
      return { kind: "sleet", label: "みぞれ", modifiers: [] };
    case 61:
    case 63:
    case 80:
    case 81:
      return { kind: "rain", label: "雨", modifiers: [] };
    case 65:
    case 82:
      return { kind: "heavyRain", label: "大雨", modifiers: [] };
    case 71:
    case 73:
    case 85:
      return { kind: "snow", label: "雪", modifiers: [] };
    case 75:
    case 77:
    case 86:
      return { kind: "heavySnow", label: "大雪", modifiers: [] };
    case 95:
    case 96:
    case 99:
      return { kind: "thunderstorm", label: "雷雨", modifiers: ["thunder"] };
    default:
      return { kind: "unknown", label: "不明", modifiers: [] };
  }
}

function mapHourlyForecast(payload: OpenMeteoResponse) {
  const times = payload.hourly?.time ?? [];
  const temps = payload.hourly?.temperature_2m ?? [];
  const windSpeeds = payload.hourly?.wind_speed_10m ?? [];
  const windDirections = payload.hourly?.wind_direction_10m ?? [];
  const precipitation = payload.hourly?.precipitation_probability ?? [];

  return times.slice(0, 24).map((time, index) => ({
    time,
    tempC: Math.round(temps[index] ?? mockWeatherData.currentTempC),
    windSpeedKph: windSpeeds[index],
    windDirectionDeg: windDirections[index],
    precipitationProbabilityPercent: precipitation[index],
  }));
}
