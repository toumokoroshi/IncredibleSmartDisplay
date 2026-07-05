import type { WidgetError, WidgetErrorCode } from "../types/widget";

export function isWidgetErrorCode(value: unknown): value is WidgetErrorCode {
  return (
    value === "NETWORK_ERROR" ||
    value === "CORS_ERROR" ||
    value === "API_RATE_LIMIT" ||
    value === "AUTH_ERROR" ||
    value === "DATA_EMPTY" ||
    value === "DATA_INVALID" ||
    value === "TIMEOUT" ||
    value === "UNKNOWN_ERROR"
  );
}

export function isRetryableErrorCode(code: WidgetErrorCode) {
  return code === "NETWORK_ERROR" || code === "CORS_ERROR" || code === "API_RATE_LIMIT" || code === "TIMEOUT" || code === "UNKNOWN_ERROR";
}

export function normalizeError(error: unknown): WidgetError {
  const message = error instanceof Error ? error.message : "Unknown error";
  const candidate = error as Partial<WidgetError> | undefined;
  const code = isWidgetErrorCode(candidate?.code) ? candidate.code : message === "TIMEOUT" ? "TIMEOUT" : message === "NETWORK_ERROR" ? "NETWORK_ERROR" : "UNKNOWN_ERROR";
  return { code, message, retryable: candidate?.retryable ?? code !== "TIMEOUT" };
}
