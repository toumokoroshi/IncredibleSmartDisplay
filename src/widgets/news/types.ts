export type NewsSettings = {
  provider: "mock";
  feeds: Array<{ id: string; name: string }>;
  maxItems: number;
  showSource: boolean;
  showPublishedAt: boolean;
};

export type NewsData = {
  items: Array<{
    id: string;
    title: string;
    summary?: string;
    category?: string;
    priority?: "top" | "normal";
    source?: string;
    publishedAt?: string;
  }>;
};
