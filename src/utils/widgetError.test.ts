import { describe, expect, it } from "vitest";

import { isRetryableErrorCode, isWidgetErrorCode, normalizeError } from "./widgetError";

describe("isWidgetErrorCode", () => {
  it("accepts known widget error codes", () => {
    expect(isWidgetErrorCode("NETWORK_ERROR")).toBe(true);
    expect(isWidgetErrorCode("UNKNOWN_ERROR")).toBe(true);
  });

  it("rejects unknown values", () => {
    expect(isWidgetErrorCode("SOMETHING_ELSE")).toBe(false);
    expect(isWidgetErrorCode(undefined)).toBe(false);
  });
});

describe("isRetryableErrorCode", () => {
  it("treats transient codes as retryable", () => {
    expect(isRetryableErrorCode("NETWORK_ERROR")).toBe(true);
    expect(isRetryableErrorCode("TIMEOUT")).toBe(true);
  });

  it("treats auth and data errors as not retryable", () => {
    expect(isRetryableErrorCode("AUTH_ERROR")).toBe(false);
    expect(isRetryableErrorCode("DATA_INVALID")).toBe(false);
  });
});

describe("normalizeError", () => {
  it("preserves a structured WidgetError-shaped error", () => {
    const error = Object.assign(new Error("Reauthentication required"), { code: "AUTH_ERROR", retryable: false });
    expect(normalizeError(error)).toEqual({ code: "AUTH_ERROR", message: "Reauthentication required", retryable: false });
  });

  it("maps a TIMEOUT message to a non-retryable TIMEOUT code", () => {
    expect(normalizeError(new Error("TIMEOUT"))).toEqual({ code: "TIMEOUT", message: "TIMEOUT", retryable: false });
  });

  it("maps a NETWORK_ERROR message to a retryable NETWORK_ERROR code", () => {
    expect(normalizeError(new Error("NETWORK_ERROR"))).toEqual({ code: "NETWORK_ERROR", message: "NETWORK_ERROR", retryable: true });
  });

  it("falls back to UNKNOWN_ERROR for unrecognized errors", () => {
    expect(normalizeError(new Error("boom"))).toEqual({ code: "UNKNOWN_ERROR", message: "boom", retryable: true });
  });

  it("falls back to a generic message for non-Error values", () => {
    expect(normalizeError("oops")).toEqual({ code: "UNKNOWN_ERROR", message: "Unknown error", retryable: true });
  });
});
