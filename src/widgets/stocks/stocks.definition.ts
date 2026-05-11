import { z } from "zod";

import { createStockService } from "../../services/stocks/stockService";
import { StocksWidget } from "./StocksWidget";

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
} as const;
