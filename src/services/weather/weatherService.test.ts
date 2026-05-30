import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { mockWeatherData } from "../../test/mocks/weather";
import { createWeatherService, mapWeatherCodeToDisplayCondition } from "./weatherService";

const openMeteoSettings = {
  provider: "openMeteo" as const,
  latitude: 35.6812,
  locationName: "Tokyo",
  longitude: 139.7671,
  showHumidity: true,
  showTomorrow: true,
  showWind: false,
  units: "metric" as const,
};

const openMeteoPayload = {
  current: {
    apparent_temperature: 20.4,
    is_day: 1,
    relative_humidity_2m: 62,
    temperature_2m: 21.2,
    weather_code: 2,
    wind_direction_10m: 180,
    wind_speed_10m: 12.5,
  },
  daily: {
    apparent_temperature_max: [22.5, 24.1],
    apparent_temperature_min: [16.4, 17.1],
    precipitation_probability_max: [30, 40],
    sunrise: ["2026-05-30T04:27", "2026-05-31T04:26"],
    sunset: ["2026-05-30T18:49", "2026-05-31T18:50"],
    temperature_2m_max: [23.2, 25.1],
    temperature_2m_min: [17.3, 18.2],
    time: ["2026-05-30", "2026-05-31"],
    uv_index_max: [6.1, 7.2],
    weather_code: [2, 61],
    wind_speed_10m_max: [20.3, 24.5],
  },
  hourly: {
    apparent_temperature: [20.4, 21.1],
    precipitation: [0, 0.2],
    precipitation_probability: [20, 30],
    relative_humidity_2m: [62, 64],
    temperature_2m: [21.2, 22.3],
    time: ["2026-05-30T09:00", "2026-05-30T10:00"],
    weather_code: [2, 3],
    wind_direction_10m: [180, 190],
    wind_speed_10m: [12.5, 13.4],
  },
};

describe("createWeatherService", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("keeps mock provider as an explicit successful data source", async () => {
    await expect(createWeatherService().fetch({ ...openMeteoSettings, provider: "mock" })).resolves.toEqual(mockWeatherData);
  });

  it("maps a valid Open-Meteo response into weather data", async () => {
    vi.setSystemTime(new Date("2026-05-30T00:10:30.000+09:00"));
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => openMeteoPayload,
      ok: true,
      status: 200,
    } as Response);

    await expect(createWeatherService().fetch(openMeteoSettings)).resolves.toMatchObject({
      conditionCode: 2,
      currentTempC: 21,
      dailyForecast: [
        expect.objectContaining({ date: "2026-05-30", highTempC: 23.2 }),
        expect.objectContaining({ date: "2026-05-31", highTempC: 25.1 }),
      ],
      hourlyForecast: [
        expect.objectContaining({ tempC: 21, time: "2026-05-30T09:00" }),
        expect.objectContaining({ tempC: 22, time: "2026-05-30T10:00" }),
      ],
      humidityPercent: 62,
      locationName: "Tokyo",
      updatedAt: "2026-05-29T15:10:30.000Z",
    });
  });

  it("rejects Open-Meteo failures instead of silently returning mock data", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 503,
    } as Response);

    await expect(createWeatherService().fetch(openMeteoSettings)).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      message: "NETWORK_ERROR",
      retryable: true,
    });
  });

  it("marks Open-Meteo rate limits as non-retryable", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 429,
    } as Response);

    await expect(createWeatherService().fetch(openMeteoSettings)).rejects.toMatchObject({
      code: "API_RATE_LIMIT",
      retryable: false,
    });
  });

  it("rejects malformed Open-Meteo success responses", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ current: { weather_code: 2 } }),
      ok: true,
      status: 200,
    } as Response);

    await expect(createWeatherService().fetch(openMeteoSettings)).rejects.toMatchObject({
      code: "DATA_INVALID",
      message: "DATA_INVALID",
      retryable: false,
    });
  });
});

describe("mapWeatherCodeToDisplayCondition", () => {
  it.each([
    [0, "clear", "晴れ"],
    [1, "mostlyClear", "晴れ"],
    [2, "partlyCloudy", "晴れ時々くもり"],
    [3, "overcast", "くもり"],
    [45, "fog", "霧"],
    [48, "fog", "霧"],
    [51, "drizzle", "霧雨"],
    [56, "sleet", "みぞれ"],
    [61, "rain", "雨"],
    [65, "heavyRain", "大雨"],
    [71, "snow", "雪"],
    [75, "heavySnow", "大雪"],
    [80, "rain", "雨"],
    [82, "heavyRain", "大雨"],
    [85, "snow", "雪"],
    [86, "heavySnow", "大雪"],
    [95, "thunderstorm", "雷雨"],
    [99, "thunderstorm", "雷雨"],
    [999, "unknown", "不明"],
  ])("maps Open-Meteo code %s to %s", (code, kind, label) => {
    expect(mapWeatherCodeToDisplayCondition(code, true)).toMatchObject({
      kind,
      label,
      transition: "stable",
      isDaytime: true,
    });
  });

  it("adds thunder modifier for thunderstorm codes", () => {
    expect(mapWeatherCodeToDisplayCondition(95, true).modifiers).toEqual(["thunder"]);
  });

  it("preserves nighttime state for icon mapping", () => {
    expect(mapWeatherCodeToDisplayCondition(0, false).isDaytime).toBe(false);
  });
});
