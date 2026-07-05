import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { useDashboardContext } from "../contexts/DashboardContext";
import type { AnyWidgetDefinition, WidgetCachePolicy, WidgetError, WidgetErrorCode, WidgetStatus } from "../types/widget";
import { readWidgetCache, writeWidgetCache } from "../utils/cache";
import { widgetQueryPolicy } from "../utils/queryPolicy";
import { getWidgetQueryKey } from "../utils/widgetQuery";
import { resolveWidgetStatus } from "../utils/widgetStatus";

function normalizeError(error: unknown): WidgetError {
  const message = error instanceof Error ? error.message : "Unknown error";
  const candidate = error as Partial<WidgetError> | undefined;
  const code = isWidgetErrorCode(candidate?.code) ? candidate.code : message === "TIMEOUT" ? "TIMEOUT" : message === "NETWORK_ERROR" ? "NETWORK_ERROR" : "UNKNOWN_ERROR";
  return { code, message, retryable: candidate?.retryable ?? code !== "TIMEOUT" };
}

function isWidgetErrorCode(value: unknown): value is WidgetErrorCode {
  return value === "NETWORK_ERROR" || value === "CORS_ERROR" || value === "API_RATE_LIMIT" || value === "AUTH_ERROR" || value === "DATA_EMPTY" || value === "DATA_INVALID" || value === "TIMEOUT" || value === "UNKNOWN_ERROR";
}

function getCachePolicy(definition: AnyWidgetDefinition | undefined, settings: unknown): WidgetCachePolicy {
  if (definition?.getCachePolicy === undefined || settings === undefined) {
    return "publicPersistent";
  }

  return definition.getCachePolicy(settings);
}

export function useWidgetData(
  config: { id: string; type: string; refreshIntervalSec: number; settings?: unknown; settingsError?: string; unknownType?: boolean },
  definition?: AnyWidgetDefinition,
) {
  const { reportWidgetState } = useDashboardContext();
  const cachePolicy = getCachePolicy(definition, config.settings);
  const cacheRecord = cachePolicy === "publicPersistent" ? readWidgetCache<unknown>(config.id) : null;
  const cache = cacheRecord !== null && definition?.validateData(cacheRecord.data) === true ? cacheRecord : null;

  const query = useQuery<any, WidgetError>({
    queryKey: getWidgetQueryKey(config.id),
    queryFn: async () => {
      if (definition?.createService === undefined || config.settings === undefined) {
        return undefined;
      }
      const service = definition.createService();
      const result = await service.fetch(config.settings);
      if (cachePolicy === "publicPersistent") {
        writeWidgetCache(config.id, result, definition.cacheTtlHours);
      }
      return result;
    },
    enabled: definition?.createService !== undefined && config.settingsError === undefined && config.unknownType === undefined,
    refetchInterval: config.refreshIntervalSec > 0 ? config.refreshIntervalSec * 1000 : false,
    ...widgetQueryPolicy,
  });

  const data = query.isError && cachePolicy === "privateNoStore" ? undefined : query.data ?? cache?.data;
  const isEmpty = data !== undefined && definition?.isEmpty(data) === true;

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
