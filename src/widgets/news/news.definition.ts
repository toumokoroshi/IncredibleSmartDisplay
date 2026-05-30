import { z } from "zod";

import { createNewsService } from "../../services/news/newsService";
import { NewsWidget } from "./NewsWidget";
import type { NewsData } from "./types";

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

const newsDataSchema: z.ZodType<NewsData> = z.object({
  generatedAt: z
    .string()
    .refine((value) => Number.isNaN(Date.parse(value)) === false)
    .optional(),
  items: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      summary: z.string().optional(),
      category: z.string().optional(),
      priority: z.enum(["top", "normal"]).optional(),
      source: z.string().optional(),
      publishedAt: z
        .string()
        .refine((value) => Number.isNaN(Date.parse(value)) === false)
        .optional(),
    }),
  ),
});

export const newsDefinition = {
  type: "news",
  component: NewsWidget,
  settingsSchema: newsSettingsSchema,
  createService: createNewsService,
  fallbackArea: "sub-right",
  defaultRefreshIntervalSec: 1800,
  cacheTtlHours: 12,
  validateData: (data: unknown): data is NewsData => newsDataSchema.safeParse(data).success,
  isEmpty: (data: NewsData) => data.items.length === 0,
  detailDisplayMode: "news",
} as const;
