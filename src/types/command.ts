export const DISPLAY_MODES = [
  "home",
  "weather",
  "calendar",
  "news",
  "traffic",
  "petPhoto",
  "stocks",
  "smartHome",
  "system",
] as const;

export type DisplayMode = (typeof DISPLAY_MODES)[number];

export type DashboardCommand =
  | { type: "SET_DISPLAY_MODE"; mode: DisplayMode }
  | { type: "REFRESH_WIDGET"; widgetId: string }
  | { type: "REFRESH_WIDGETS"; widgetIds: string[] }
  | { type: "TRIGGER_ACTION"; actionId: string };
