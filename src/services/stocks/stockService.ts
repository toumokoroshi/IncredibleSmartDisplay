import type { WidgetService } from "../../types/widget";
import { mockStocksData } from "./mockData";
import type { StocksData, StocksSettings } from "../../widgets/stocks";

export function createStockService(): WidgetService<StocksSettings, StocksData> {
  return {
    async fetch() {
      return mockStocksData;
    },
  };
}
