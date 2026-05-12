import { mockWeatherData } from "../../test/mocks/weather";
import type { WidgetService } from "../../types/widget";
import { withTimeout } from "../../utils/timeout";
import type { WeatherData, WeatherSettings } from "../../widgets/weather";

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    weather_code?: number;
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

const weatherCodeMap: Record<number, string> = {
  0: "Clear",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  61: "Rain",
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
        url.searchParams.set("current", "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m");
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
        return {
          locationName: settings.locationName,
          currentTempC: Math.round(payload.current?.temperature_2m ?? mockWeatherData.currentTempC),
          highTempC: payload.daily?.temperature_2m_max?.[0],
          lowTempC: payload.daily?.temperature_2m_min?.[0],
          conditionLabel: weatherCodeMap[conditionCode] ?? "Unknown",
          conditionCode,
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
