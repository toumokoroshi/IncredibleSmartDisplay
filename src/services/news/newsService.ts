import type { WidgetService } from "../../types/widget";
import { mockNewsData } from "./mockData";
import type { NewsData, NewsSettings } from "../../widgets/news";

export function createNewsService(): WidgetService<NewsSettings, NewsData> {
  return {
    async fetch() {
      return mockNewsData;
    },
  };
}
