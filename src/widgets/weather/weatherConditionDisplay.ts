import type { WeatherConditionKind, WeatherData, WeatherDisplayCondition, WeatherModifier, WeatherTransition } from "./types";

export const unavailableCondition: WeatherDisplayCondition = {
  kind: "unknown",
  label: "\u4e0d\u660e",
  transition: "stable",
  modifiers: [],
  isDaytime: true,
};

export function getDisplayCondition(data: WeatherData): WeatherDisplayCondition {
  return (
    data.displayCondition ?? {
      kind: mapLegacyConditionKind(data.conditionCode, data.conditionLabel),
      label: data.conditionLabel,
      transition: "stable",
      modifiers: [],
      isDaytime: true,
    }
  );
}

export function mapLegacyConditionKind(conditionCode?: number, conditionLabel = ""): WeatherConditionKind {
  const normalizedLabel = conditionLabel.toLowerCase();

  switch (conditionCode) {
    case 0:
      return "clear";
    case 1:
      return "mostlyClear";
    case 2:
      return "partlyCloudy";
    case 3:
      return "overcast";
    case 45:
    case 48:
      return "fog";
    case 51:
    case 53:
    case 55:
      return "drizzle";
    case 56:
    case 57:
    case 66:
    case 67:
      return "sleet";
    case 61:
    case 63:
    case 80:
    case 81:
      return "rain";
    case 65:
    case 82:
      return "heavyRain";
    case 71:
    case 73:
    case 85:
      return "snow";
    case 75:
    case 77:
    case 86:
      return "heavySnow";
    case 95:
    case 96:
    case 99:
      return "thunderstorm";
  }

  if (normalizedLabel.includes("clear")) {
    return "clear";
  }
  if (normalizedLabel.includes("cloud")) {
    return "partlyCloudy";
  }
  if (normalizedLabel.includes("rain")) {
    return "rain";
  }
  return "unknown";
}

export function getMeteoconsIconName(kind: WeatherConditionKind, isDaytime: boolean) {
  const dayPart = isDaytime ? "day" : "night";

  switch (kind) {
    case "clear":
      return `clear-${dayPart}`;
    case "mostlyClear":
      return `mostly-clear-${dayPart}`;
    case "partlyCloudy":
      return `partly-cloudy-${dayPart}`;
    case "overcast":
      return `overcast-${dayPart}`;
    case "fog":
      return `fog-${dayPart}`;
    case "drizzle":
      return "drizzle";
    case "rain":
      return "rain";
    case "heavyRain":
      return "extreme-rain";
    case "snow":
      return "snow";
    case "heavySnow":
      return "extreme-snow";
    case "sleet":
      return "sleet";
    case "thunderstorm":
      return `thunderstorms-${dayPart}-rain`;
    case "unknown":
      return "not-available";
  }
}

export function formatConditionLabel(condition: WeatherDisplayCondition) {
  if (condition.transition === "stable" || condition.secondaryKind === undefined) {
    return condition.label;
  }

  return `${condition.label} ${getTransitionLabel(condition.transition)} ${getKindLabel(condition.secondaryKind)}`;
}

export function getTransitionLabel(transition: WeatherTransition) {
  switch (transition) {
    case "stable":
      return "";
    case "then":
      return "\u306e\u3061";
    case "occasional":
      return "\u6642\u3005";
    case "temporary":
      return "\u4e00\u6642";
  }
}

export function getKindLabel(kind: WeatherConditionKind) {
  switch (kind) {
    case "clear":
    case "mostlyClear":
      return "\u6674\u308c";
    case "partlyCloudy":
      return "\u6674\u308c\u6642\u3005\u304f\u3082\u308a";
    case "overcast":
      return "\u304f\u3082\u308a";
    case "fog":
      return "\u9727";
    case "drizzle":
      return "\u9727\u96e8";
    case "rain":
      return "\u96e8";
    case "heavyRain":
      return "\u5927\u96e8";
    case "snow":
      return "\u96ea";
    case "heavySnow":
      return "\u5927\u96ea";
    case "sleet":
      return "\u307f\u305e\u308c";
    case "thunderstorm":
      return "\u96f7\u96e8";
    case "unknown":
      return "\u4e0d\u660e";
  }
}

export function getModifierLabel(modifier: WeatherModifier) {
  switch (modifier) {
    case "rainChance":
      return "\u96e8\u306e\u53ef\u80fd\u6027";
    case "thunder":
      return "\u96f7";
    case "strongWind":
      return "\u5f37\u98a8";
  }
}
