import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { dashboardConfig } from "../../config/dashboard.config";
import type { TrafficSettings } from "../../widgets/traffic";
import { trafficDefinition } from "../../widgets/traffic";
import { createTrafficService } from "./trafficService";
import trafficJsonRaw from "../../../public/data/traffic.json?raw";

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

  it("orders static JSON lines by impact and applies local display metadata", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({
        lines: [
          { id: "jr-yamanote", name: "Provider Yamanote", operator: "Provider JR", status: "normal", updatedAt: "2026-05-22T07:29:00+09:00" },
          { id: "tokyo-metro-tozai", name: "Provider Tozai", operator: "Provider Metro", status: "delayed", updatedAt: "2026-05-22T07:28:00+09:00" },
          { id: "jr-chuo-rapid", name: "Provider Chuo", operator: "Provider JR", status: "suspended", updatedAt: "2026-05-22T07:27:00+09:00" },
        ],
        updatedAt: "2026-05-22T07:30:00+09:00",
      }),
      ok: true,
      status: 200,
    } as Response);

    const service = createTrafficService();
    const data = await service.fetch({
      allowLocalOverride: true,
      lines: [
        { id: "jr-yamanote", name: "Yamanote", operator: "JR", priority: 1 },
        { displayName: "Tozai", id: "tokyo-metro-tozai", name: "Tozai Line", operator: "Metro", priority: 2 },
        { id: "jr-chuo-rapid", name: "Chuo Rapid", operator: "JR", priority: 3 },
      ],
      maxItems: 8,
      provider: "staticJson",
      showLineUpdatedAt: true,
      url: "/data/traffic.json",
    });

    expect(data.lines.map((line) => line.id)).toEqual(["jr-chuo-rapid", "tokyo-metro-tozai", "jr-yamanote"]);
    expect(data.lines[1]).toMatchObject({ id: "tokyo-metro-tozai", name: "Tozai", operator: "Metro" });
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

  it("rejects static JSON traffic data with invalid timestamps", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({
        lines: [{ id: "jr-yamanote", name: "Yamanote", status: "normal", updatedAt: "not-a-date" }],
        updatedAt: "2026-05-22T07:30:00+09:00",
      }),
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

  it("keeps the published traffic JSON aligned with the configured route contract", () => {
    const trafficWidget = dashboardConfig.widgets.find((widget) => widget.id === "traffic-main");
    const trafficSettings = trafficWidget?.settings as Extract<TrafficSettings, { provider: "staticJson" }> | undefined;
    const payload = JSON.parse(trafficJsonRaw) as unknown;

    expect(trafficSettings?.provider).toBe("staticJson");
    expect(trafficSettings?.lines).toBeDefined();
    expect(trafficDefinition.validateData(payload)).toBe(true);

    if (!trafficSettings?.lines || !trafficDefinition.validateData(payload)) {
      throw new Error("traffic-main static JSON contract is not testable");
    }

    const configuredLinesById = new Map(trafficSettings.lines.map((line) => [line.id, line]));
    const payloadLineIds = payload.lines.map((line) => line.id);

    expect(new Set(payloadLineIds).size).toBe(payloadLineIds.length);
    expect(payloadLineIds.sort()).toEqual(trafficSettings.lines.map((line) => line.id).sort());
    expect(Date.parse(payload.updatedAt)).not.toBeNaN();

    for (const line of payload.lines) {
      const configuredLine = configuredLinesById.get(line.id);
      expect(configuredLine).toBeDefined();
      expect(line.name).toBe(configuredLine?.displayName ?? configuredLine?.name);
      expect(line.operator).toBe(configuredLine?.operator);
      expect(Date.parse(line.updatedAt)).not.toBeNaN();
      expect(line.name).not.toMatch(/ぶり|placeholder|dummy|test/i);
    }
  });
});
