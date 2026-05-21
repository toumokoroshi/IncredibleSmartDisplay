import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { TrafficSettings } from "../../widgets/traffic";
import { createTrafficService } from "./trafficService";

const settings: TrafficSettings = {
  allowLocalOverride: true,
  lines: [
    { id: "jr-yamanote", name: "Yamanote", priority: 1 },
    { id: "jr-chuo-rapid", name: "Chuo Rapid", priority: 2 },
    { displayName: "Tozai", id: "tokyo-metro-tozai", name: "Tozai", priority: 3 },
  ],
  maxItems: 8,
  provider: "mock",
  showLineUpdatedAt: true,
};

describe("traffic service", () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("1970-01-01T00:10:30.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns configured lines ordered by operational impact", async () => {
    const service = createTrafficService();

    const data = await service.fetch(settings);

    expect(data.lines.map((line) => line.id)).toEqual(["jr-chuo-rapid", "tokyo-metro-tozai", "jr-yamanote"]);
    expect(data.lines[1]?.name).toBe("Tozai");
    expect(data.updatedAt).toBe("2026-05-19T07:40:00+09:00");
  });

  it("fetches and validates static JSON traffic data", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({
        lines: [
          { id: "jr-chuo-rapid", name: "Chuo", status: "delayed", updatedAt: "2026-05-22T07:28:00+09:00" },
          { id: "jr-yamanote", name: "Yamanote", status: "normal", updatedAt: "2026-05-22T07:29:00+09:00" },
        ],
        updatedAt: "2026-05-22T07:30:00+09:00",
      }),
      ok: true,
      status: 200,
    } as Response);

    const service = createTrafficService();
    const data = await service.fetch({
      allowLocalOverride: true,
      cacheBusterIntervalSec: 300,
      lines: [{ id: "jr-yamanote", name: "Yamanote" }],
      maxItems: 8,
      provider: "staticJson",
      showLineUpdatedAt: true,
      url: "/data/traffic.json",
    });

    expect(fetch).toHaveBeenCalledWith("/data/traffic.json?v=2");
    expect(data).toEqual({
      lines: [{ id: "jr-yamanote", name: "Yamanote", status: "normal", updatedAt: "2026-05-22T07:29:00+09:00" }],
      updatedAt: "2026-05-22T07:30:00+09:00",
    });
  });

  it("rejects malformed static JSON traffic data", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ lines: [{ id: "missing-status", name: "Broken" }], updatedAt: "2026-05-22T07:30:00+09:00" }),
      ok: true,
      status: 200,
    } as Response);

    const service = createTrafficService();

    await expect(
      service.fetch({
        allowLocalOverride: true,
        maxItems: 8,
        provider: "staticJson",
        showLineUpdatedAt: true,
        url: "/data/traffic.json",
      }),
    ).rejects.toThrow("Invalid traffic JSON");
  });
});
