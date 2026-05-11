import type { WidgetRegistry } from "../types/widget";
import { calendarDefinition } from "../widgets/calendar";
import { newsDefinition } from "../widgets/news";
import { quickAreaDefinition } from "../widgets/quickArea";
import { stocksDefinition } from "../widgets/stocks";
import { weatherDefinition } from "../widgets/weather";

export const widgetRegistry: WidgetRegistry = {
  weather: weatherDefinition,
  calendar: calendarDefinition,
  stocks: stocksDefinition,
  news: newsDefinition,
  quickArea: quickAreaDefinition,
};
