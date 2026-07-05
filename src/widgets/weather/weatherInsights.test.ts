import { describe, expect, it } from "vitest";

import type { WeatherDailySummary, WeatherDisplayCondition, WeatherHourlyPoint } from "./types";
import { getDailyJudgementSummary, getDailyWeatherNote, getHourlyWeatherNote, getWeatherInsights } from "./weatherInsights";

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

describe("getDailyWeatherNote", () => {
  it("returns an empty note without a summary", () => {
    expect(getDailyWeatherNote(undefined, "today")).toBe("");
  });

  it("prioritizes strong UV over heat and rain for today", () => {
    expect(getDailyWeatherNote({ label: "Today", precipitationProbabilityPercent: 80, uvIndexMax: 7 }, "today")).toBe("UVやや強め。外出時は日差し対策を。");
  });

  it("prioritizes heat over rain for today when UV is not high", () => {
    expect(getDailyWeatherNote({ apparentHighTempC: 30, label: "Today", precipitationProbabilityPercent: 80 }, "today")).toBe("昼は暑く感じるため、水分補給を。");
  });

  it("falls back to a rain note for today when neither UV nor heat trigger", () => {
    expect(getDailyWeatherNote({ label: "Today", precipitationProbabilityPercent: 80 }, "today")).toBe("雨具があると安心です。");
  });

  it("defaults to no-umbrella-needed for today with no signals", () => {
    expect(getDailyWeatherNote({ label: "Today" }, "today")).toBe("雨具なしでも心配なし。");
  });

  it("prioritizes rain over the temperature gap for tomorrow", () => {
    expect(getDailyWeatherNote({ highTempC: 30, label: "Tomorrow", lowTempC: 10, precipitationProbabilityPercent: 80 }, "tomorrow")).toBe("明日は雨具があると安心です。");
  });

  it("flags a large morning/evening temperature gap for tomorrow", () => {
    expect(getDailyWeatherNote({ highTempC: 28, label: "Tomorrow", lowTempC: 15 }, "tomorrow")).toBe("朝夕の気温差に注意。");
  });

  it("defaults to no major change for tomorrow with no signals", () => {
    expect(getDailyWeatherNote({ highTempC: 22, label: "Tomorrow", lowTempC: 18 }, "tomorrow")).toBe("大きな天気崩れなし。");
  });
});

describe("getHourlyWeatherNote", () => {
  it("prioritizes an upcoming rainy hour over wind", () => {
    const hourly: WeatherHourlyPoint[] = [
      { precipitationProbabilityPercent: 10, tempC: 20, time: "2026-05-20T10:00:00+09:00", windSpeedKph: 40 },
      { precipitationProbabilityPercent: 60, tempC: 20, time: "2026-05-20T15:00:00+09:00" },
    ];
    expect(getHourlyWeatherNote(hourly)).toBe("15時時以降 雨の可能性");
  });

  it("reports a strong-wind hour when no rain is expected", () => {
    const hourly: WeatherHourlyPoint[] = [{ tempC: 20, time: "2026-05-20T12:00:00+09:00", windSpeedKph: 30 }];
    expect(getHourlyWeatherNote(hourly)).toBe("12時時ごろ 風が強め");
  });

  it("defaults to no notable change when neither rain nor wind trigger", () => {
    expect(getHourlyWeatherNote([{ tempC: 20, time: "2026-05-20T12:00:00+09:00" }])).toBe("大きな時間帯変化なし");
  });
});
