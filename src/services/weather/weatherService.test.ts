import { describe, expect, it } from "vitest";

import { mapWeatherCodeToDisplayCondition } from "./weatherService";

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
