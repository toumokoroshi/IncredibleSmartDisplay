import type { NewsData } from "../../widgets/news";

export const mockNewsData: NewsData = {
  items: [
    { id: "1", title: "Markets recover after steady inflation print", source: "NHK", publishedAt: new Date().toISOString() },
    { id: "2", title: "New device refresh improves smart-home battery life", source: "ITmedia", publishedAt: new Date().toISOString() },
  ],
};
