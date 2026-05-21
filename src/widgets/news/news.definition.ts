import { z } from "zod";

import { createNewsService } from "../../services/news/newsService";
import { NewsWidget } from "./NewsWidget";

const newsBaseSettingsSchema = {
  maxItems: z.number().int().positive(),
  showPublishedAt: z.boolean(),
  showSource: z.boolean(),
};

export const newsSettingsSchema = z.discriminatedUnion("provider", [
  z.object({
    ...newsBaseSettingsSchema,
    feeds: z.array(z.object({ id: z.string(), name: z.string() })).min(1),
    provider: z.literal("mock"),
  }),
  z.object({
    ...newsBaseSettingsSchema,
    cacheBusterIntervalSec: z.number().int().positive().optional(),
    provider: z.literal("staticJson"),
    url: z.string().min(1),
  }),
]);

export const newsDefinition = {
  type: "news",
  component: NewsWidget,
  settingsSchema: newsSettingsSchema,
  createService: createNewsService,
  fallbackArea: "sub-right",
  defaultRefreshIntervalSec: 1800,
} as const;
