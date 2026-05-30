import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchJsonProvider, fetchStaticJson, fetchWorkerJson } from "./jsonProvider";

function isTestData(value: unknown): value is { ok: boolean } {
  return value !== null && typeof value === "object" && (value as { ok?: unknown }).ok === true;
}

describe("jsonProvider", () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  it("fetches and validates JSON through the low-level provider", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ ok: true }),
      ok: true,
      status: 200,
    } as Response);

    await expect(
      fetchJsonProvider({
        failureMessagePrefix: "Failed test JSON",
        invalidMessage: "Invalid test JSON",
        init: { method: "POST" },
        url: "/api/test",
        validate: isTestData,
      }),
    ).resolves.toEqual({ ok: true });

    expect(fetch).toHaveBeenCalledWith("/api/test", { method: "POST" });
  });

  it("keeps static JSON as a public asset wrapper with cache busting", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ ok: true }),
      ok: true,
      status: 200,
    } as Response);

    await fetchStaticJson({
      cacheBusterIntervalSec: 300,
      failureMessagePrefix: "Failed static JSON",
      invalidMessage: "Invalid static JSON",
      url: "/data/test.json",
      validate: isTestData,
    });

    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/^\/data\/test\.json\?v=\d+$/));
  });

  it("keeps worker JSON as a no-store wrapper that can be customized", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ ok: true }),
      ok: true,
      status: 200,
    } as Response);

    await fetchWorkerJson({
      failureMessagePrefix: "Failed worker JSON",
      init: { headers: { "x-provider": "calendar" } },
      invalidMessage: "Invalid worker JSON",
      url: "https://worker.example.test/calendar",
      validate: isTestData,
    });

    expect(fetch).toHaveBeenCalledWith("https://worker.example.test/calendar", {
      cache: "no-store",
      headers: { "x-provider": "calendar" },
      method: "GET",
    });
  });

  it("normalizes invalid JSON data", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ ok: false }),
      ok: true,
      status: 200,
    } as Response);

    await expect(
      fetchJsonProvider({
        failureMessagePrefix: "Failed test JSON",
        invalidMessage: "Invalid test JSON",
        url: "/api/test",
        validate: isTestData,
      }),
    ).rejects.toMatchObject({ code: "DATA_INVALID", message: "Invalid test JSON", retryable: false });
  });

  it("normalizes structured worker errors", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ error: { code: "API_RATE_LIMIT", message: "Calendar worker rate limited", retryable: false } }),
      ok: false,
      status: 429,
    } as Response);

    await expect(
      fetchWorkerJson({
        failureMessagePrefix: "Failed worker JSON",
        invalidMessage: "Invalid worker JSON",
        url: "https://worker.example.test/calendar",
        validate: isTestData,
      }),
    ).rejects.toMatchObject({
      code: "API_RATE_LIMIT",
      message: "Calendar worker rate limited",
      retryable: false,
    });
  });

  it("falls back to HTTP status when worker error payload has an unknown code", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ error: { code: "GOOGLE_CALENDAR_DOWN", message: "Provider failed" } }),
      ok: false,
      status: 503,
    } as Response);

    await expect(
      fetchWorkerJson({
        failureMessagePrefix: "Failed worker JSON",
        invalidMessage: "Invalid worker JSON",
        url: "https://worker.example.test/calendar",
        validate: isTestData,
      }),
    ).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      message: "Failed worker JSON: 503",
      retryable: true,
    });
  });
});
