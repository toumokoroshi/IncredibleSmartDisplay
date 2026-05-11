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
    source?: string;
    publishedAt?: string;
  }>;
};
