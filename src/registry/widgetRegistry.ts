import type { WidgetRegistry } from "../types/widget";
import { calendarDefinition } from "../widgets/calendar";
import { newsDefinition } from "../widgets/news";
import { quickAreaDefinition } from "../widgets/quickArea";
import { stocksDefinition } from "../widgets/stocks";
import { trafficDefinition } from "../widgets/traffic";
import { weatherDefinition } from "../widgets/weather";

export const widgetRegistry: WidgetRegistry = {
  weather: weatherDefinition,
  calendar: calendarDefinition,
  stocks: stocksDefinition,
  news: newsDefinition,
  traffic: trafficDefinition,
  quickArea: quickAreaDefinition,
};
