import type { WidgetError } from "../types/widget";

export const widgetQueryPolicy = {
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  retry: (failureCount: number, error: WidgetError | Error) => {
    const retryable = "retryable" in error ? error.retryable : true;
    return retryable !== false && failureCount < 2;
  },
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 4000),
};
