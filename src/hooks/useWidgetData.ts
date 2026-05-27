import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { useDashboardContext } from "../contexts/DashboardContext";
import type { AnyWidgetDefinition, WidgetError, WidgetStatus } from "../types/widget";
import { readWidgetCache, writeWidgetCache } from "../utils/cache";
import { widgetQueryPolicy } from "../utils/queryPolicy";
import { getWidgetQueryKey } from "../utils/widgetQuery";
import { resolveWidgetStatus } from "../utils/widgetStatus";

function getTtlHours(widgetType: string) {
  switch (widgetType) {
    case "weather":
      return 3;
    case "calendar":
      return 24;
    case "stocks":
    case "news":
      return 12;
    case "traffic":
      return 1;
    case "petPhoto":
      return 24;
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
    queryKey: getWidgetQueryKey(config.id),
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
  const lines = data && typeof data === "object" ? (data as { lines?: unknown[] }).lines : undefined;
  const photo = data && typeof data === "object" ? (data as { photo?: unknown }).photo : undefined;
  const isEmpty = Array.isArray(items) ? items.length === 0 : Array.isArray(lines) ? lines.length === 0 : data && typeof data === "object" && "photo" in data ? photo === undefined : false;

  const status: WidgetStatus = resolveWidgetStatus({
    cache,
    isError: query.isError,
    isFetched: query.isFetched,
    isFetching: query.isFetching,
    isOnline: typeof navigator === "undefined" ? true : navigator.onLine,
    isPending: query.isPending,
  });

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
