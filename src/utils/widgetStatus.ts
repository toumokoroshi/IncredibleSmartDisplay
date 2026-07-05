import type { WidgetCacheRecord } from "./cache";
import { isCacheExpired } from "./cache";
import type { WidgetStatus } from "../types/widget";

export type WidgetStatusInput = {
  cache?: WidgetCacheRecord<unknown> | null;
  isError: boolean;
  isFetched: boolean;
  isFetching: boolean;
  isOnline: boolean;
  isPending: boolean;
};

export function resolveWidgetStatus({
  cache,
  isError,
  isFetched,
  isFetching,
  isOnline,
  isPending,
}: WidgetStatusInput): WidgetStatus {
  if (!isFetched && isPending && cache?.data === undefined) {
    return "loading";
  }

  if (isError && cache?.data !== undefined) {
    return "stale";
  }

  if (isError && !isOnline) {
    return "offline";
  }

  if (isError) {
    return "error";
  }

  if (cache !== null && cache !== undefined && isCacheExpired(cache) && !isFetching) {
    return "stale";
  }

  return "success";
}

