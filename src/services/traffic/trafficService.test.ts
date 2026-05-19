import { describe, expect, it } from "vitest";

import type { TrafficSettings } from "../../widgets/traffic";
import { createTrafficService } from "./trafficService";

const settings: TrafficSettings = {
  provider: "mock",
  lines: [
    { id: "jr-yamanote", name: "山手線", priority: 1 },
    { id: "jr-chuo-rapid", name: "中央線快速", priority: 2 },
    { id: "tokyo-metro-tozai", name: "東西線", displayName: "東西線", priority: 3 },
  ],
  maxItems: 8,
  showLineUpdatedAt: true,
  allowLocalOverride: true,
};

describe("traffic service", () => {
  it("returns configured lines ordered by operational impact", async () => {
    const service = createTrafficService();

    const data = await service.fetch(settings);

    expect(data.lines.map((line) => line.id)).toEqual(["jr-chuo-rapid", "tokyo-metro-tozai", "jr-yamanote"]);
    expect(data.lines[1].name).toBe("東西線");
    expect(data.updatedAt).toBe("2026-05-19T07:40:00+09:00");
  });
});
