import { z } from "zod";

import { createNewsService } from "../../services/news/newsService";
import { NewsWidget } from "./NewsWidget";

export const newsSettingsSchema = z.object({
  provider: z.literal("mock"),
  feeds: z.array(z.object({ id: z.string(), name: z.string() })).min(1),
  maxItems: z.number().int().positive(),
  showSource: z.boolean(),
  showPublishedAt: z.boolean(),
});

export const newsDefinition = {
  type: "news",
  component: NewsWidget,
  settingsSchema: newsSettingsSchema,
  createService: createNewsService,
  fallbackArea: "sub-right",
  defaultRefreshIntervalSec: 1800,
} as const;
