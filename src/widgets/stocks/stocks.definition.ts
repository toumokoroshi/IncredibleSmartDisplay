import { z } from "zod";

import { createStockService } from "../../services/stocks/stockService";
import { StocksWidget } from "./StocksWidget";
import type { StocksData } from "./types";

export const stocksSettingsSchema = z.object({
  provider: z.literal("mock"),
  symbols: z.array(z.string()).min(1),
  maxItems: z.number().int().positive(),
  showCurrency: z.boolean(),
  showMarketState: z.boolean(),
});

export const stocksDefinition = {
  type: "stocks",
  component: StocksWidget,
  settingsSchema: stocksSettingsSchema,
  createService: createStockService,
  fallbackArea: "sub-left",
  defaultRefreshIntervalSec: 600,
  cacheTtlHours: 12,
  isEmpty: (data: StocksData) => data.items.length === 0,
  detailDisplayMode: "stocks",
} as const;
