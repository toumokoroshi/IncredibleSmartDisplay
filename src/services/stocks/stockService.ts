import type { WidgetService } from "../../types/widget";
import { fetchStaticJson, fetchWorkerJson } from "../jsonProvider";
import { mockStocksData } from "./mockData";
import type { StocksData, StocksSettings } from "../../widgets/stocks";

type StockItem = StocksData["items"][number];

function optionalString(value: unknown) {
  return value === undefined || typeof value === "string";
}

function isStocksData(value: unknown): value is StocksData {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const items = (value as { items?: unknown }).items;
  return Array.isArray(items) && items.every(isStockItem);
}

function isStockItem(value: unknown): value is StockItem {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const item = value as Partial<Record<keyof StockItem, unknown>>;
  return (
    typeof item.symbol === "string" &&
    typeof item.name === "string" &&
    typeof item.price === "number" &&
    (item.changePercent === undefined || typeof item.changePercent === "number") &&
    optionalString(item.marketState)
  );
}

function applyStocksSettings(data: StocksData, settings: StocksSettings): StocksData {
  const symbolSet = new Set(settings.symbols);
  return {
    items: data.items.filter((item) => symbolSet.has(item.symbol)).slice(0, settings.maxItems),
  };
}

async function fetchStaticJsonStocks(settings: Extract<StocksSettings, { provider: "staticJson" }>) {
  const payload = await fetchStaticJson({
    cacheBusterIntervalSec: settings.cacheBusterIntervalSec,
    failureMessagePrefix: "Failed to fetch stocks JSON",
    invalidMessage: "Invalid stocks JSON",
    url: settings.url,
    validate: isStocksData,
  });

  return applyStocksSettings(payload, settings);
}

async function fetchWorkerJsonStocks(settings: Extract<StocksSettings, { provider: "workerJson" }>) {
  const payload = await fetchWorkerJson({
    failureMessagePrefix: "Failed to fetch stocks worker JSON",
    invalidMessage: "Invalid stocks JSON",
    url: settings.url,
    validate: isStocksData,
  });

  return applyStocksSettings(payload, settings);
}

export function createStockService(): WidgetService<StocksSettings, StocksData> {
  return {
    async fetch(settings) {
      if (settings.provider === "staticJson") {
        return fetchStaticJsonStocks(settings);
      }

      if (settings.provider === "workerJson") {
        return fetchWorkerJsonStocks(settings);
      }

      return applyStocksSettings(mockStocksData, settings);
    },
  };
}
