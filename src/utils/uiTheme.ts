export const uiThemes = [
  "nocturne",
  "aurora",
  "graphite",
  "nest",
  "nest-hub",
  "nest-gallery",
  "nest-control",
  "nest-google",
  "nest-flat",
  "nest-material",
  "nest-topglow",
] as const;

export type UiTheme = (typeof uiThemes)[number];

export function getUiThemeFromLocation(search: string): UiTheme {
  const value = new URLSearchParams(search).get("ui");
  return uiThemes.includes(value as UiTheme) ? (value as UiTheme) : "nest-topglow";
}
