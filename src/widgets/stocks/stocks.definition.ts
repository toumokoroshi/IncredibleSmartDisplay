import { z } from "zod";

import { createStockService } from "../../services/stocks/stockService";
import { StocksWidget } from "./StocksWidget";
import type { StocksData } from "./types";

const stocksBaseSettingsSchema = {
  symbols: z.array(z.string()).min(1),
  maxItems: z.number().int().positive(),
  showCurrency: z.boolean(),
  showMarketState: z.boolean(),
};

export const stocksSettingsSchema = z.discriminatedUnion("provider", [
  z.object({
    ...stocksBaseSettingsSchema,
    provider: z.literal("mock"),
  }),
  z.object({
    ...stocksBaseSettingsSchema,
    cacheBusterIntervalSec: z.number().int().positive().optional(),
    provider: z.literal("staticJson"),
    url: z.string().min(1),
  }),
  z.object({
    ...stocksBaseSettingsSchema,
    provider: z.literal("workerJson"),
    url: z.string().min(1),
  }),
]);

const stocksDataSchema: z.ZodType<StocksData> = z.object({
  items: z.array(
    z.object({
      symbol: z.string(),
      name: z.string(),
      price: z.number(),
      changePercent: z.number().optional(),
      marketState: z.string().optional(),
    }),
  ),
});

export const stocksDefinition = {
  type: "stocks",
  component: StocksWidget,
  settingsSchema: stocksSettingsSchema,
  createService: createStockService,
  fallbackArea: "sub-left",
  defaultRefreshIntervalSec: 600,
  cacheTtlHours: 12,
  validateData: (data: unknown): data is StocksData => stocksDataSchema.safeParse(data).success,
  isEmpty: (data: StocksData) => data.items.length === 0,
  detailDisplayMode: "stocks",
} as const;
