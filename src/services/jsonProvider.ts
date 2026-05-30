import type { WidgetError, WidgetErrorCode } from "../types/widget";
import { appendCacheBuster } from "../utils/cacheBuster";
import { resolvePublicAssetPath } from "../utils/publicAssetPath";
import { withTimeout } from "../utils/timeout";

type ServiceError = Error & WidgetError;

type JsonProviderFetchOptions<TData> = {
  failureMessagePrefix: string;
  init?: RequestInit;
  invalidMessage: string;
  resolveUrl?: (url: string) => string;
  timeoutMs?: number;
  url: string;
  validate: (value: unknown) => value is TData;
};

type StaticJsonFetchOptions<TData> = Omit<JsonProviderFetchOptions<TData>, "init" | "resolveUrl"> & {
  cacheBusterIntervalSec?: number;
};

type WorkerJsonFetchOptions<TData> = Omit<JsonProviderFetchOptions<TData>, "resolveUrl">;

function createJsonProviderError(code: WidgetErrorCode, message: string, retryable: boolean): ServiceError {
  const error = new Error(message) as ServiceError;
  error.code = code;
  error.retryable = retryable;
  return error;
}

function isWidgetErrorCode(value: unknown): value is WidgetErrorCode {
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

function isRetryableErrorCode(code: WidgetErrorCode) {
  return code === "NETWORK_ERROR" || code === "CORS_ERROR" || code === "API_RATE_LIMIT" || code === "TIMEOUT" || code === "UNKNOWN_ERROR";
}

function getStructuredErrorPayload(payload: unknown) {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return undefined;
  }

  const candidate = "error" in payload ? (payload as { error?: unknown }).error : payload;
  if (candidate === null || typeof candidate !== "object" || Array.isArray(candidate)) {
    return undefined;
  }

  const error = candidate as { code?: unknown; message?: unknown; retryable?: unknown };
  if (!isWidgetErrorCode(error.code)) {
    return undefined;
  }

  return {
    code: error.code,
    message: typeof error.message === "string" && error.message.length > 0 ? error.message : error.code,
    retryable: typeof error.retryable === "boolean" ? error.retryable : isRetryableErrorCode(error.code),
  };
}

async function readStructuredError(response: Response) {
  try {
    return getStructuredErrorPayload(await response.json());
  } catch {
    return undefined;
  }
}

function createHttpError(status: number, message: string) {
  if (status === 401 || status === 403) {
    return createJsonProviderError("AUTH_ERROR", message, false);
  }

  if (status === 429) {
    return createJsonProviderError("API_RATE_LIMIT", message, true);
  }

  return createJsonProviderError("NETWORK_ERROR", message, true);
}

function normalizeFetchError(error: unknown) {
  if (error instanceof Error && error.message === "TIMEOUT") {
    return createJsonProviderError("TIMEOUT", "TIMEOUT", false);
  }

  return createJsonProviderError("NETWORK_ERROR", "NETWORK_ERROR", true);
}

export async function fetchJsonProvider<TData>({
  failureMessagePrefix,
  init,
  invalidMessage,
  resolveUrl = (url) => url,
  timeoutMs = 10000,
  url,
  validate,
}: JsonProviderFetchOptions<TData>): Promise<TData> {
  const requestUrl = resolveUrl(url);
  const request = init === undefined ? fetch(requestUrl) : fetch(requestUrl, init);
  const response = await withTimeout(request, timeoutMs).catch((error: unknown) => {
    throw normalizeFetchError(error);
  });

  if (!response.ok) {
    const structuredError = await readStructuredError(response);
    if (structuredError !== undefined) {
      throw createJsonProviderError(structuredError.code, structuredError.message, structuredError.retryable);
    }

    throw createHttpError(response.status, `${failureMessagePrefix}: ${response.status}`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw createJsonProviderError("DATA_INVALID", invalidMessage, false);
  }

  if (!validate(payload)) {
    throw createJsonProviderError("DATA_INVALID", invalidMessage, false);
  }

  return payload;
}

export async function fetchStaticJson<TData>({
  cacheBusterIntervalSec,
  ...options
}: StaticJsonFetchOptions<TData>): Promise<TData> {
  return fetchJsonProvider({
    ...options,
    resolveUrl: (url) => appendCacheBuster(resolvePublicAssetPath(url), cacheBusterIntervalSec),
  });
}

export async function fetchWorkerJson<TData>({
  init,
  ...options
}: WorkerJsonFetchOptions<TData>): Promise<TData> {
  return fetchJsonProvider({
    ...options,
    init: {
      cache: "no-store",
      method: "GET",
      ...init,
    },
  });
}
