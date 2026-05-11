import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { useDashboardContext } from "../contexts/DashboardContext";
import type { AnyWidgetDefinition, WidgetError, WidgetStatus } from "../types/widget";
import { isCacheExpired, readWidgetCache, writeWidgetCache } from "../utils/cache";
import { widgetQueryPolicy } from "../utils/queryPolicy";

function getTtlHours(widgetType: string) {
  switch (widgetType) {
    case "weather":
      return 3;
    case "calendar":
      return 24;
    case "stocks":
    case "news":
      return 12;
    default:
      return 6;
  }
}

function normalizeError(error: unknown): WidgetError {
  const message = error instanceof Error ? error.message : "Unknown error";
  const code = message === "TIMEOUT" ? "TIMEOUT" : "UNKNOWN_ERROR";
  return { code, message, retryable: code === "TIMEOUT" ? false : true };
}

export function useWidgetData(
  config: { id: string; type: string; refreshIntervalSec: number; settings?: unknown; settingsError?: string; unknownType?: boolean },
  definition?: AnyWidgetDefinition,
) {
  const { reportWidgetState } = useDashboardContext();
  const cache = readWidgetCache<any>(config.id);

  const query = useQuery<any, WidgetError>({
    queryKey: ["widget-data", config.id],
    queryFn: async () => {
      if (definition?.createService === undefined || config.settings === undefined) {
        return undefined;
      }
      const service = definition.createService();
      const result = await service.fetch(config.settings);
      writeWidgetCache(config.id, result, getTtlHours(config.type));
      return result;
    },
    enabled: definition?.createService !== undefined && config.settingsError === undefined && config.unknownType === undefined,
    refetchInterval: config.refreshIntervalSec > 0 ? config.refreshIntervalSec * 1000 : false,
    ...widgetQueryPolicy,
  });

  const data = query.data ?? cache?.data;
  const items = data && typeof data === "object" ? (data as { items?: unknown[] }).items : undefined;
  const isEmpty = Array.isArray(items) ? items.length === 0 : false;

  let status: WidgetStatus;
  if (query.isFetched === false && query.isPending === true && cache?.data === undefined) {
    status = "loading";
  } else if (query.isError === true && cache?.data !== undefined) {
    status = "stale";
  } else if (query.isError === true && typeof navigator !== "undefined" && navigator.onLine === false) {
    status = "offline";
  } else if (query.isError === true) {
    status = "error";
  } else if (cache !== null && cache !== undefined && isCacheExpired(cache) && query.isFetching === false) {
    status = "stale";
  } else {
    status = "success";
  }

  useEffect(() => {
    reportWidgetState(config.id, status, query.isSuccess ? new Date().toISOString() : undefined);
  }, [config.id, query.isSuccess, reportWidgetState, status]);

  return {
    data,
    status,
    error: query.error ? normalizeError(query.error) : undefined,
    isEmpty,
  };
}
