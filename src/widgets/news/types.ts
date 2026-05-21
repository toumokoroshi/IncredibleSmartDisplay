type NewsBaseSettings = {
  maxItems: number;
  showSource: boolean;
  showPublishedAt: boolean;
};

export type MockNewsSettings = NewsBaseSettings & {
  provider: "mock";
  feeds: Array<{ id: string; name: string }>;
};

export type StaticJsonNewsSettings = NewsBaseSettings & {
  provider: "staticJson";
  url: string;
};

export type NewsSettings = MockNewsSettings | StaticJsonNewsSettings;

export type NewsItem = {
  id: string;
  title: string;
  summary?: string;
  category?: string;
  priority?: "top" | "normal";
  source?: string;
  publishedAt?: string;
};

export type NewsData = {
  items: NewsItem[];
};
