type StocksBaseSettings = {
  symbols: string[];
  maxItems: number;
  showCurrency: boolean;
  showMarketState: boolean;
};

export type MockStocksSettings = StocksBaseSettings & {
  provider: "mock";
};

export type StaticJsonStocksSettings = StocksBaseSettings & {
  provider: "staticJson";
  url: string;
  cacheBusterIntervalSec?: number;
};

export type WorkerJsonStocksSettings = StocksBaseSettings & {
  provider: "workerJson";
  url: string;
};

export type StocksSettings = MockStocksSettings | StaticJsonStocksSettings | WorkerJsonStocksSettings;

export type StocksData = {
  items: Array<{
    symbol: string;
    name: string;
    price: number;
    changePercent?: number;
    marketState?: string;
  }>;
};
