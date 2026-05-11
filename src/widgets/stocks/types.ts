export type StocksSettings = {
  provider: "mock";
  symbols: string[];
  maxItems: number;
  showCurrency: boolean;
  showMarketState: boolean;
};

export type StocksData = {
  items: Array<{
    symbol: string;
    name: string;
    price: number;
    changePercent?: number;
    marketState?: string;
  }>;
};
