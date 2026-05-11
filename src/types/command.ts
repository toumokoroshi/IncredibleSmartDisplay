export type DisplayMode =
  | "home"
  | "weather"
  | "calendar"
  | "news"
  | "stocks"
  | "smartHome"
  | "system";

export type DashboardCommand =
  | { type: "SET_DISPLAY_MODE"; mode: DisplayMode }
  | { type: "REFRESH_WIDGET"; widgetId: string }
  | { type: "TRIGGER_ACTION"; actionId: string };
