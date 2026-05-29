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
