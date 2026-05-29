import type { WidgetError, WidgetErrorCode } from "../../types/widget";
import { withTimeout } from "../../utils/timeout";
import type { WeatherConditionKind, WeatherDailySummary, WeatherData, WeatherDisplayCondition, WeatherModifier, WeatherSettings } from "../../widgets/weather";
import { mockWeatherData } from "./mockData";

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    weather_code?: number;
    is_day?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    apparent_temperature_max?: number[];
    apparent_temperature_min?: number[];
    precipitation_probability_max?: number[];
    wind_speed_10m_max?: number[];
    uv_index_max?: number[];
    sunrise?: string[];
    sunset?: string[];
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    apparent_temperature?: number[];
    relative_humidity_2m?: number[];
    weather_code?: number[];
    wind_speed_10m?: number[];
    wind_direction_10m?: number[];
    precipitation_probability?: number[];
    precipitation?: number[];
  };
};

type ServiceError = Error & WidgetError;

function createServiceError(code: WidgetErrorCode, message = code, retryable = true): ServiceError {
  const error = new Error(message) as ServiceError;
  error.code = code;
  error.retryable = retryable;
  return error;
}

function normalizeOpenMeteoError(error: unknown): ServiceError {
  const candidate = error as Partial<ServiceError> | undefined;
  if (candidate?.code) {
    return candidate as ServiceError;
  }

  if (error instanceof Error && error.message === "TIMEOUT") {
    return createServiceError("TIMEOUT", "TIMEOUT", false);
  }

  return createServiceError("NETWORK_ERROR", "NETWORK_ERROR");
}

function createOpenMeteoUrl(settings: WeatherSettings) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(settings.latitude));
  url.searchParams.set("longitude", String(settings.longitude));
  url.searchParams.set("current", "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day,wind_speed_10m,wind_direction_10m");
  url.searchParams.set("hourly", "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,precipitation_probability,precipitation,wind_speed_10m,wind_direction_10m");
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_probability_max,wind_speed_10m_max,uv_index_max,sunrise,sunset");
  url.searchParams.set("forecast_days", "2");
  url.searchParams.set("timezone", "Asia/Tokyo");
  return url;
}

export async function fetchOpenMeteoWeather(settings: WeatherSettings): Promise<WeatherData> {
  try {
    const response = await withTimeout(fetch(createOpenMeteoUrl(settings)), 10000);
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw createServiceError("AUTH_ERROR", "AUTH_ERROR", false);
      }
      if (response.status === 429) {
        throw createServiceError("API_RATE_LIMIT", "API_RATE_LIMIT", false);
      }
      throw createServiceError("NETWORK_ERROR", "NETWORK_ERROR");
    }

    const payload = (await response.json()) as OpenMeteoResponse;
    return mapOpenMeteoWeather(payload, settings);
  } catch (error) {
    throw normalizeOpenMeteoError(error);
  }
}

function mapOpenMeteoWeather(payload: OpenMeteoResponse, settings: WeatherSettings): WeatherData {
  const conditionCode = payload.current?.weather_code ?? 2;
  const displayCondition = mapWeatherCodeToDisplayCondition(conditionCode, payload.current?.is_day !== 0);
  const todayConditionCode = payload.daily?.weather_code?.[0] ?? conditionCode;
  const todayCondition = mapWeatherCodeToDisplayCondition(todayConditionCode, true);

  return {
    locationName: settings.locationName,
    currentTempC: Math.round(payload.current?.temperature_2m ?? mockWeatherData.currentTempC),
    apparentTempC: payload.current?.apparent_temperature,
    highTempC: payload.daily?.temperature_2m_max?.[0],
    lowTempC: payload.daily?.temperature_2m_min?.[0],
    conditionLabel: displayCondition.label,
    conditionCode,
    displayCondition,
    todayCondition,
    windSpeedKph: payload.current?.wind_speed_10m,
    windDirectionDeg: payload.current?.wind_direction_10m,
    humidityPercent: payload.current?.relative_humidity_2m ?? mockWeatherData.humidityPercent,
    precipitationProbabilityPercent: payload.hourly?.precipitation_probability?.[0],
    todayPrecipitationProbabilityPercent: payload.daily?.precipitation_probability_max?.[0],
    todayMaxWindSpeedKph: payload.daily?.wind_speed_10m_max?.[0],
    dailyForecast: mapDailyForecast(payload, payload.current?.relative_humidity_2m, payload.current?.wind_direction_10m),
    hourlyForecast: mapHourlyForecast(payload),
    updatedAt: new Date().toISOString(),
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

function mapDailyForecast(payload: OpenMeteoResponse, currentHumidity?: number, currentWindDirection?: number): WeatherDailySummary[] {
  const times = payload.daily?.time ?? [];
  const conditionCodes = payload.daily?.weather_code ?? [];
  const highTemps = payload.daily?.temperature_2m_max ?? [];
  const lowTemps = payload.daily?.temperature_2m_min ?? [];
  const apparentHighTemps = payload.daily?.apparent_temperature_max ?? [];
  const apparentLowTemps = payload.daily?.apparent_temperature_min ?? [];
  const precipitation = payload.daily?.precipitation_probability_max ?? [];
  const maxWinds = payload.daily?.wind_speed_10m_max ?? [];
  const uvIndex = payload.daily?.uv_index_max ?? [];
  const sunrise = payload.daily?.sunrise ?? [];
  const sunset = payload.daily?.sunset ?? [];

  return times.slice(0, 2).map((date, index) => ({
    label: index === 0 ? "Today" : "Tomorrow",
    date,
    condition: mapWeatherCodeToDisplayCondition(conditionCodes[index] ?? 2, true),
    highTempC: highTemps[index],
    lowTempC: lowTemps[index],
    apparentHighTempC: apparentHighTemps[index],
    apparentLowTempC: apparentLowTemps[index],
    precipitationProbabilityPercent: precipitation[index],
    maxWindSpeedKph: maxWinds[index],
    humidityPercent: averageHourlyValueForDate(payload.hourly?.relative_humidity_2m, payload.hourly?.time, date) ?? (index === 0 ? currentHumidity : undefined),
    windDirectionDeg: averageHourlyValueForDate(payload.hourly?.wind_direction_10m, payload.hourly?.time, date) ?? currentWindDirection,
    uvIndexMax: uvIndex[index],
    sunrise: sunrise[index],
    sunset: sunset[index],
  }));
}

function averageHourlyValueForDate(values: number[] | undefined, times: string[] | undefined, date: string) {
  const matchingValues =
    times
      ?.map((time, index) => (time.startsWith(date) ? values?.[index] : undefined))
      .filter((value): value is number => value !== undefined) ?? [];

  if (matchingValues.length === 0) {
    return undefined;
  }

  return Math.round(matchingValues.reduce((sum, value) => sum + value, 0) / matchingValues.length);
}

function mapHourlyForecast(payload: OpenMeteoResponse) {
  const times = payload.hourly?.time ?? [];
  const temps = payload.hourly?.temperature_2m ?? [];
  const apparentTemps = payload.hourly?.apparent_temperature ?? [];
  const conditionCodes = payload.hourly?.weather_code ?? [];
  const humidity = payload.hourly?.relative_humidity_2m ?? [];
  const windSpeeds = payload.hourly?.wind_speed_10m ?? [];
  const windDirections = payload.hourly?.wind_direction_10m ?? [];
  const precipitation = payload.hourly?.precipitation_probability ?? [];
  const precipitationMm = payload.hourly?.precipitation ?? [];

  return times.slice(0, 48).map((time, index) => ({
    time,
    tempC: Math.round(temps[index] ?? mockWeatherData.currentTempC),
    apparentTempC: apparentTemps[index],
    condition: mapWeatherCodeToDisplayCondition(conditionCodes[index] ?? 2, isDaytimeHour(time)),
    humidityPercent: humidity[index],
    windSpeedKph: windSpeeds[index],
    windDirectionDeg: windDirections[index],
    precipitationProbabilityPercent: precipitation[index],
    precipitationMm: precipitationMm[index],
  }));
}

function isDaytimeHour(time: string) {
  const hour = new Date(time).getHours();
  return hour >= 6 && hour < 18;
}
