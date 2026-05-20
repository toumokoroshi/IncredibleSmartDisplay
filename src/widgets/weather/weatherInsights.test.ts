import { describe, expect, it } from "vitest";

import type { WeatherDailySummary, WeatherDisplayCondition, WeatherHourlyPoint } from "./types";
import { getDailyJudgementSummary, getWeatherInsights } from "./weatherInsights";

const condition: WeatherDisplayCondition = {
  isDaytime: true,
  kind: "clear",
  label: "Clear",
  modifiers: [],
  transition: "stable",
};

describe("weatherInsights", () => {
  it("summarizes rainy, hot, UV, temperature, rain, and wind signals", () => {
    const daily: WeatherDailySummary[] = [
      {
        apparentHighTempC: 32,
        condition,
        highTempC: 30,
        label: "Today",
        maxWindSpeedKph: 36,
        precipitationProbabilityPercent: 60,
        uvIndexMax: 7,
      },
      {
        highTempC: 24,
        label: "Tomorrow",
        maxWindSpeedKph: 18,
        precipitationProbabilityPercent: 20,
      },
    ];
    const hourly: WeatherHourlyPoint[] = [{ precipitationProbabilityPercent: 75, tempC: 24, time: "2026-05-20T15:00:00+09:00" }];

    const insights = getWeatherInsights(daily, hourly);

    expect(insights.map((insight) => insight.badge)).toEqual(["Rain", "Feel", "UV 7", "Temp", "Rain", "Wind"]);
  });

  it("uses a good weather insight when rain is unlikely", () => {
    expect(getWeatherInsights([{ condition, highTempC: 20, label: "Today" }], []).at(0)).toEqual({
      badge: "Good",
      label: "大きな天気崩れなし",
    });
  });

  it.each([
    [{ condition: { ...condition, modifiers: ["thunder"] }, label: "Today" }, [], "雷雨に注意"],
    [{ label: "Today", precipitationProbabilityPercent: 60 }, [], "傘があると安心"],
    [{ label: "Today", maxWindSpeedKph: 30 }, [], "風が強め"],
    [{ apparentHighTempC: 32, label: "Today" }, [], "昼は暑さに注意"],
    [{ apparentHighTempC: 29, label: "Today" }, [], "昼は暖かく感じる"],
    [{ label: "Today", lowTempC: 8 }, [], "朝晩は冷える"],
    [{ highTempC: 25, label: "Today", lowTempC: 12 }, [], "寒暖差に注意"],
    [{ label: "Today", uvIndexMax: 6 }, [], "紫外線対策を忘れずに"],
    [{ label: "Today" }, [{ precipitationMm: 1.2, tempC: 20, time: "2026-05-20T10:00:00+09:00" }], "傘があると安心"],
    [{ label: "Today" }, [], "雨具なしでも心配なし"],
  ] satisfies Array<[WeatherDailySummary, WeatherHourlyPoint[], string]>)("returns daily judgement: %s", (summary, hourly, expected) => {
    expect(getDailyJudgementSummary(summary, hourly)).toBe(expected);
  });

  it("returns an empty judgement without a summary", () => {
    expect(getDailyJudgementSummary()).toBe("");
  });
});
