import type { StocksData } from "../../widgets/stocks";

export const mockStocksData: StocksData = {
  items: [
    { symbol: "^N225", name: "Nikkei 225", price: 39125.11, changePercent: 0.61, marketState: "Open" },
    { symbol: "^IXIC", name: "Nasdaq", price: 18912.88, changePercent: -0.12, marketState: "Closed" },
  ],
};
