import type { WidgetService } from "../../types/widget";
import { mockStocksData } from "../../test/mocks/stocks";
import type { StocksData, StocksSettings } from "../../widgets/stocks";

export function createStockService(): WidgetService<StocksSettings, StocksData> {
  return {
    async fetch() {
      return mockStocksData;
    },
  };
}
