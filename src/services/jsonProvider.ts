import type { WidgetError, WidgetErrorCode } from "../types/widget";
import { appendCacheBuster } from "../utils/cacheBuster";
import { resolvePublicAssetPath } from "../utils/publicAssetPath";
import { withTimeout } from "../utils/timeout";
import { isRetryableErrorCode, isWidgetErrorCode } from "../utils/widgetError";

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

function createHttpError(status: number, failureMessagePrefix: string) {
  if (status === 401) {
    return createJsonProviderError("AUTH_ERROR", "Reauthentication required", false);
  }

  if (status === 403) {
    return createJsonProviderError("AUTH_ERROR", "Access denied", false);
  }

  if (status === 429) {
    return createJsonProviderError("API_RATE_LIMIT", `${failureMessagePrefix}: ${status}`, true);
  }

  return createJsonProviderError("NETWORK_ERROR", `${failureMessagePrefix}: ${status}`, true);
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

    throw createHttpError(response.status, failureMessagePrefix);
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
  const headers = new Headers(init?.headers);
  if (!headers.has("X-Requested-With")) {
    headers.set("X-Requested-With", "XMLHttpRequest");
  }

  return fetchJsonProvider({
    ...options,
    init: {
      cache: "no-store",
      method: "GET",
      ...init,
      headers,
    },
  });
}
